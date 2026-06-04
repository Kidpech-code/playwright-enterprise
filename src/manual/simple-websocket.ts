import crypto from 'crypto';
import http from 'http';
import net from 'net';

type MessageHandler = (message: string, peer: WebSocketPeer) => void;
type CloseHandler = (peer: WebSocketPeer) => void;
type ConnectionHandler = (peer: WebSocketPeer) => void;

export class WebSocketPeer {
  private buffer = Buffer.alloc(0);
  private readonly messageHandlers: MessageHandler[] = [];
  private readonly closeHandlers: CloseHandler[] = [];

  constructor(private readonly socket: net.Socket) {
    this.socket.on('data', (chunk) => {
      this.handleData(typeof chunk === 'string' ? Buffer.from(chunk) : Buffer.from(chunk));
    });
    this.socket.on('close', () => this.closeHandlers.forEach((handler) => handler(this)));
    this.socket.on('error', () => this.closeHandlers.forEach((handler) => handler(this)));
  }

  onMessage(handler: MessageHandler): void {
    this.messageHandlers.push(handler);
  }

  onClose(handler: CloseHandler): void {
    this.closeHandlers.push(handler);
  }

  sendJson(value: unknown): void {
    this.sendText(JSON.stringify(value));
  }

  sendText(value: string): void {
    if (this.socket.destroyed) {
      return;
    }

    const payload = Buffer.from(value, 'utf8');
    const header = this.createFrameHeader(0x1, payload.length);
    this.socket.write(Buffer.concat([header, payload]));
  }

  close(): void {
    if (!this.socket.destroyed) {
      this.socket.end();
    }
  }

  private createFrameHeader(opcode: number, payloadLength: number): Buffer {
    if (payloadLength < 126) {
      return Buffer.from([0x80 | opcode, payloadLength]);
    }

    if (payloadLength <= 0xffff) {
      const header = Buffer.alloc(4);
      header[0] = 0x80 | opcode;
      header[1] = 126;
      header.writeUInt16BE(payloadLength, 2);
      return header;
    }

    const header = Buffer.alloc(10);
    header[0] = 0x80 | opcode;
    header[1] = 127;
    header.writeBigUInt64BE(BigInt(payloadLength), 2);
    return header;
  }

  private handleData(chunk: Buffer): void {
    this.buffer = Buffer.concat([this.buffer, chunk]);

    while (this.buffer.length >= 2) {
      const firstByte = this.buffer[0];
      const secondByte = this.buffer[1];
      const opcode = firstByte & 0x0f;
      const masked = (secondByte & 0x80) === 0x80;
      let payloadLength = secondByte & 0x7f;
      let offset = 2;

      if (payloadLength === 126) {
        if (this.buffer.length < offset + 2) {
          return;
        }
        payloadLength = this.buffer.readUInt16BE(offset);
        offset += 2;
      } else if (payloadLength === 127) {
        if (this.buffer.length < offset + 8) {
          return;
        }
        payloadLength = Number(this.buffer.readBigUInt64BE(offset));
        offset += 8;
      }

      const maskLength = masked ? 4 : 0;
      const frameLength = offset + maskLength + payloadLength;
      if (this.buffer.length < frameLength) {
        return;
      }

      const mask = masked ? this.buffer.subarray(offset, offset + 4) : undefined;
      offset += maskLength;
      const payload = Buffer.from(this.buffer.subarray(offset, offset + payloadLength));
      this.buffer = this.buffer.subarray(frameLength);

      if (mask) {
        for (let index = 0; index < payload.length; index += 1) {
          payload[index] ^= mask[index % 4];
        }
      }

      if (opcode === 0x1) {
        const text = payload.toString('utf8');
        this.messageHandlers.forEach((handler) => handler(text, this));
      } else if (opcode === 0x8) {
        this.close();
      } else if (opcode === 0x9) {
        const header = this.createFrameHeader(0xA, payload.length);
        this.socket.write(Buffer.concat([header, payload]));
      }
    }
  }
}

export class SimpleWebSocketServer {
  private readonly server = http.createServer();
  private readonly peers = new Set<WebSocketPeer>();
  private readonly connectionHandlers: ConnectionHandler[] = [];

  constructor(
    private readonly port: number,
    private readonly host = '127.0.0.1',
  ) {
    this.server.on('upgrade', (request, socket) => {
      const key = request.headers['sec-websocket-key'];
      if (typeof key !== 'string') {
        socket.destroy();
        return;
      }

      const accept = crypto
        .createHash('sha1')
        .update(`${key}258EAFA5-E914-47DA-95CA-C5AB0DC85B11`)
        .digest('base64');

      socket.write([
        'HTTP/1.1 101 Switching Protocols',
        'Upgrade: websocket',
        'Connection: Upgrade',
        `Sec-WebSocket-Accept: ${accept}`,
        '',
        '',
      ].join('\r\n'));

      const peer = new WebSocketPeer(socket as net.Socket);
      this.peers.add(peer);
      peer.onClose(() => this.peers.delete(peer));
      this.connectionHandlers.forEach((handler) => handler(peer));
    });
  }

  onConnection(handler: ConnectionHandler): void {
    this.connectionHandlers.push(handler);
  }

  async listen(): Promise<void> {
    await new Promise<void>((resolve, reject) => {
      const onError = (error: Error): void => {
        this.server.off('listening', onListening);
        reject(error);
      };
      const onListening = (): void => {
        this.server.off('error', onError);
        resolve();
      };

      this.server.once('error', onError);
      this.server.once('listening', onListening);
      this.server.listen(this.port, this.host);
    });
  }

  broadcastJson(value: unknown): void {
    for (const peer of this.peers) {
      peer.sendJson(value);
    }
  }

  async close(): Promise<void> {
    for (const peer of this.peers) {
      peer.close();
    }

    await new Promise<void>((resolve) => {
      this.server.close(() => resolve());
    });
  }
}
