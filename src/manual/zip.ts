import fs from 'fs';
import path from 'path';
import { ensureDir, readDirectoryFiles } from './utils';

interface ZipEntry {
  name: string;
  data: Buffer;
  crc: number;
  modifiedAt: Date;
  localHeaderOffset: number;
}

const crcTable = new Uint32Array(256);
for (let index = 0; index < 256; index += 1) {
  let value = index;
  for (let bit = 0; bit < 8; bit += 1) {
    value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
  }
  crcTable[index] = value >>> 0;
}

function crc32(buffer: Buffer): number {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function getDosDateTime(date: Date): { dosDate: number; dosTime: number } {
  const year = Math.max(1980, date.getFullYear());
  const dosTime =
    (date.getHours() << 11) |
    (date.getMinutes() << 5) |
    Math.floor(date.getSeconds() / 2);
  const dosDate =
    ((year - 1980) << 9) |
    ((date.getMonth() + 1) << 5) |
    date.getDate();

  return { dosDate, dosTime };
}

function createLocalHeader(entry: ZipEntry): Buffer {
  const name = Buffer.from(entry.name, 'utf8');
  const { dosDate, dosTime } = getDosDateTime(entry.modifiedAt);
  const header = Buffer.alloc(30);
  header.writeUInt32LE(0x04034b50, 0);
  header.writeUInt16LE(20, 4);
  header.writeUInt16LE(0, 6);
  header.writeUInt16LE(0, 8);
  header.writeUInt16LE(dosTime, 10);
  header.writeUInt16LE(dosDate, 12);
  header.writeUInt32LE(entry.crc, 14);
  header.writeUInt32LE(entry.data.length, 18);
  header.writeUInt32LE(entry.data.length, 22);
  header.writeUInt16LE(name.length, 26);
  header.writeUInt16LE(0, 28);
  return Buffer.concat([header, name]);
}

function createCentralDirectoryHeader(entry: ZipEntry): Buffer {
  const name = Buffer.from(entry.name, 'utf8');
  const { dosDate, dosTime } = getDosDateTime(entry.modifiedAt);
  const header = Buffer.alloc(46);
  header.writeUInt32LE(0x02014b50, 0);
  header.writeUInt16LE(20, 4);
  header.writeUInt16LE(20, 6);
  header.writeUInt16LE(0, 8);
  header.writeUInt16LE(0, 10);
  header.writeUInt16LE(dosTime, 12);
  header.writeUInt16LE(dosDate, 14);
  header.writeUInt32LE(entry.crc, 16);
  header.writeUInt32LE(entry.data.length, 20);
  header.writeUInt32LE(entry.data.length, 24);
  header.writeUInt16LE(name.length, 28);
  header.writeUInt16LE(0, 30);
  header.writeUInt16LE(0, 32);
  header.writeUInt16LE(0, 34);
  header.writeUInt16LE(0, 36);
  header.writeUInt32LE(0, 38);
  header.writeUInt32LE(entry.localHeaderOffset, 42);
  return Buffer.concat([header, name]);
}

function createEndOfCentralDirectory(
  entryCount: number,
  centralDirectorySize: number,
  centralDirectoryOffset: number,
): Buffer {
  const footer = Buffer.alloc(22);
  footer.writeUInt32LE(0x06054b50, 0);
  footer.writeUInt16LE(0, 4);
  footer.writeUInt16LE(0, 6);
  footer.writeUInt16LE(entryCount, 8);
  footer.writeUInt16LE(entryCount, 10);
  footer.writeUInt32LE(centralDirectorySize, 12);
  footer.writeUInt32LE(centralDirectoryOffset, 16);
  footer.writeUInt16LE(0, 20);
  return footer;
}

export function createZipFromDirectory(sourceDir: string, outputPath: string): string {
  ensureDir(path.dirname(outputPath));

  const files = readDirectoryFiles(sourceDir).filter(
    (filePath) => path.resolve(filePath) !== path.resolve(outputPath),
  );
  const outputChunks: Buffer[] = [];
  const centralDirectoryChunks: Buffer[] = [];
  const entries: ZipEntry[] = [];
  let offset = 0;

  for (const filePath of files) {
    const data = fs.readFileSync(filePath);
    const stats = fs.statSync(filePath);
    const entry: ZipEntry = {
      name: path.relative(sourceDir, filePath).split(path.sep).join('/'),
      data,
      crc: crc32(data),
      modifiedAt: stats.mtime,
      localHeaderOffset: offset,
    };
    const localHeader = createLocalHeader(entry);
    outputChunks.push(localHeader, data);
    offset += localHeader.length + data.length;
    entries.push(entry);
  }

  for (const entry of entries) {
    centralDirectoryChunks.push(createCentralDirectoryHeader(entry));
  }

  const centralDirectory = Buffer.concat(centralDirectoryChunks);
  const footer = createEndOfCentralDirectory(
    entries.length,
    centralDirectory.length,
    offset,
  );

  fs.writeFileSync(outputPath, Buffer.concat([...outputChunks, centralDirectory, footer]));
  return outputPath;
}
