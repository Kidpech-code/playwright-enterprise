import fs from 'fs';
import path from 'path';
import {
  BrowserContext,
  chromium,
  ConsoleMessage,
  Page,
  Request,
  Response,
} from '@playwright/test';
import { cursorOverlayInitScript } from './cursor-overlay';
import { createManualReport } from './report';
import { SimpleWebSocketServer, WebSocketPeer } from './simple-websocket';
import {
  ManualAgentMessage,
  ManualCapturePayload,
  ManualControllerState,
  ManualLogEntry,
  ManualNetworkEntry,
  ManualReportResult,
  ManualSessionRecord,
  ManualStep,
  ManualStepKind,
} from './types';
import {
  createSessionId,
  ensureDir,
  PROJECT_ROOT,
  sanitizeFilePart,
  toRelativeArtifact,
} from './utils';

export interface ManualSessionOptions {
  targetUrl: string;
  baseURL?: string;
  port: number;
  reportRoot: string;
  userDataDir: string;
  extensionDir: string;
  sessionName?: string;
  proxy?: string;
  browserChannel?: string;
  viewport: {
    width: number;
    height: number;
  };
}

function isInternalPage(url: string): boolean {
  return (
    url === 'about:blank' ||
    url.startsWith('chrome-extension://') ||
    url.startsWith('devtools://') ||
    url.startsWith('chrome://')
  );
}

function stringifyMessage(value: unknown): string {
  if (typeof value === 'string') {
    return value;
  }
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function payloadString(
  payload: Record<string, unknown> | undefined,
  key: string,
): string | undefined {
  const value = payload?.[key];
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function payloadBoolean(
  payload: Record<string, unknown> | undefined,
  key: string,
): boolean | undefined {
  const value = payload?.[key];
  return typeof value === 'boolean' ? value : undefined;
}

export class ManualSessionRuntime {
  readonly session: ManualSessionRecord;

  private context?: BrowserContext;
  private server?: SimpleWebSocketServer;
  private stepCounter = 0;
  private reportPromise?: Promise<ManualReportResult>;
  private completionResolve?: (result: ManualReportResult) => void;
  private completionReject?: (error: Error) => void;
  private readonly completion: Promise<ManualReportResult>;
  private pausedByController = false;
  private stopRequested = false;
  private readonly controlResolvers = new Set<() => void>();

  constructor(private readonly options: ManualSessionOptions) {
    const sessionId = createSessionId();
    const reportDir = path.join(options.reportRoot, sessionId);
    this.session = {
      id: sessionId,
      name: options.sessionName || 'Manual Testing Companion Session',
      targetUrl: options.targetUrl,
      status: 'created',
      controllerState: 'idle',
      startedAt: new Date().toISOString(),
      reportDir,
      agentPort: options.port,
      cursorVisible: true,
      steps: [],
      consoleLogs: [],
      networkIssues: [],
      artifacts: {
        videos: [],
        screenshotsDir: 'screenshots',
        domSnapshotsDir: 'snapshots',
      },
    };

    this.completion = new Promise<ManualReportResult>((resolve, reject) => {
      this.completionResolve = resolve;
      this.completionReject = reject;
    });
  }

  async start(): Promise<void> {
    try {
      await this.setControllerState('preparing', {
        targetUrl: this.options.targetUrl,
        reportDir: this.session.reportDir,
      });
      ensureDir(this.session.reportDir);
      ensureDir(path.join(this.session.reportDir, this.session.artifacts.screenshotsDir));
      ensureDir(path.join(this.session.reportDir, this.session.artifacts.domSnapshotsDir));
      ensureDir(path.join(this.session.reportDir, 'video'));
      ensureDir(this.options.userDataDir);

      this.server = new SimpleWebSocketServer(this.options.port);
      this.server.onConnection((peer) => this.attachPeer(peer));
      await this.server.listen();

      const args = [
        `--disable-extensions-except=${this.options.extensionDir}`,
        `--load-extension=${this.options.extensionDir}`,
        '--no-first-run',
        '--no-default-browser-check',
      ];

      const launchOptions: Parameters<typeof chromium.launchPersistentContext>[1] = {
        baseURL: this.options.baseURL || getBaseURL(this.options.targetUrl),
        headless: false,
        viewport: this.options.viewport,
        recordVideo: {
          dir: path.join(this.session.reportDir, 'video'),
          size: this.options.viewport,
        },
        args,
      };

      if (this.options.browserChannel) {
        launchOptions.channel = this.options.browserChannel;
      }

      if (this.options.proxy) {
        launchOptions.proxy = { server: this.options.proxy };
      }

      this.context = await chromium.launchPersistentContext(
        this.options.userDataDir,
        launchOptions,
      );
      await this.context.addInitScript(cursorOverlayInitScript());
      await this.context.tracing.start({
        screenshots: true,
        snapshots: true,
        sources: true,
      });

      this.context.on('page', (page) => this.attachPage(page));
      this.context.pages().forEach((page) => this.attachPage(page));

      const page = this.context.pages().find((candidate) => !isInternalPage(candidate.url()))
        || (await this.context.newPage());
      this.session.status = 'running';
      await page.goto(this.options.targetUrl, { waitUntil: 'domcontentloaded' });
      await this.setCursorVisible(true);
      await this.captureStep('session-start', {
        label: 'Manual session started',
        note: `Target URL: ${this.options.targetUrl}`,
      });
      await this.setControllerState('recording', {
        sessionId: this.session.id,
        reportDir: this.session.reportDir,
      });
    } catch (error) {
      this.session.status = 'failed';
      await this.setControllerState('error', {
        message: error instanceof Error ? error.message : String(error),
      });
      await this.shutdown();
      throw error;
    }
  }

  waitForCompletion(): Promise<ManualReportResult> {
    return this.completion;
  }

  async finish(status: 'completed' | 'interrupted' = 'completed'): Promise<ManualReportResult> {
    this.stopRequested = true;
    this.wakeControlWaiters();
    if (this.reportPromise) {
      return this.reportPromise;
    }

    this.reportPromise = this.finishInternal(status);
    return this.reportPromise;
  }

  async getActivePage(): Promise<Page> {
    const page = await this.resolveTargetPage();
    if (!page) {
      throw new Error('No active test page is available for the manual session.');
    }
    return page;
  }

  async setControllerState(
    state: ManualControllerState,
    payload: Record<string, unknown> = {},
  ): Promise<void> {
    this.session.controllerState = state;
    this.server?.broadcastJson({
      type: 'controller:state',
      payload: {
        state,
        status: this.session.status,
        cursorVisible: this.session.cursorVisible,
        ...payload,
      },
    });
  }

  async recordEvidence(
    kind: ManualStepKind,
    payload: ManualCapturePayload,
  ): Promise<ManualStep> {
    const previousState = this.session.controllerState || 'recording';
    await this.setControllerState('capturing', { label: payload.label || kind });
    const step = await this.captureStep(kind, payload);
    this.server?.broadcastJson({
      type: 'step:recorded',
      payload: {
        step,
        status: this.session.status,
        cursorVisible: this.session.cursorVisible,
      },
    });
    await this.setControllerState(
      this.pausedByController ? 'paused' : previousState === 'capturing' ? 'recording' : previousState,
      { label: payload.label || kind },
    );
    return step;
  }

  isStopRequested(): boolean {
    return this.stopRequested || Boolean(this.reportPromise);
  }

  isPaused(): boolean {
    return this.pausedByController;
  }

  async waitWhilePaused(): Promise<void> {
    while (this.pausedByController && !this.isStopRequested()) {
      await this.waitForControlSignal();
    }
  }

  async pauseForDebug(note: string): Promise<void> {
    this.pausedByController = true;
    this.session.status = 'paused';
    await this.setControllerState('paused', { note });
    await this.recordEvidence('pause', {
      label: 'Tutorial paused for debug',
      note,
      category: 'tutorial-debug',
    });
  }

  async controlledDelay(milliseconds: number): Promise<void> {
    if (milliseconds <= 0 || this.isStopRequested()) {
      return;
    }

    await this.waitWhilePaused();
    if (this.isStopRequested()) {
      return;
    }

    await this.waitForControlSignalOrTimeout(milliseconds);
    await this.waitWhilePaused();
  }

  private attachPeer(peer: WebSocketPeer): void {
    peer.sendJson({
      type: 'agent:status',
      payload: {
        sessionId: this.session.id,
        status: this.session.status,
        controllerState: this.session.controllerState,
        cursorVisible: this.session.cursorVisible,
        targetUrl: this.session.targetUrl,
        reportDir: this.session.reportDir,
      },
    });

    peer.onMessage((message) => {
      void this.handlePeerMessage(message, peer);
    });
  }

  private attachPage(page: Page): void {
    page.on('console', (message) => this.recordConsoleMessage(message, page));
    page.on('pageerror', (error) => {
      this.session.consoleLogs.push({
        timestamp: new Date().toISOString(),
        type: 'pageerror',
        message: error.message,
        url: page.url(),
      });
    });
    page.on('requestfailed', (request) => this.recordRequestFailure(request));
    page.on('response', (response) => this.recordProblemResponse(response));
  }

  private recordConsoleMessage(message: ConsoleMessage, page: Page): void {
    if (isInternalPage(page.url())) {
      return;
    }

    const location = message.location();
    this.session.consoleLogs.push({
      timestamp: new Date().toISOString(),
      type: message.type(),
      message: stringifyMessage(message.text()),
      url: page.url(),
      location: location.url ? `${location.url}:${location.lineNumber}` : undefined,
    });
  }

  private recordRequestFailure(request: Request): void {
    if (isInternalPage(request.url())) {
      return;
    }

    this.session.networkIssues.push({
      timestamp: new Date().toISOString(),
      url: request.url(),
      method: request.method(),
      resourceType: request.resourceType(),
      failure: request.failure()?.errorText || 'Request failed',
    });
  }

  private recordProblemResponse(response: Response): void {
    const status = response.status();
    const request = response.request();
    if (status < 400 || isInternalPage(response.url())) {
      return;
    }

    this.session.networkIssues.push({
      timestamp: new Date().toISOString(),
      url: response.url(),
      method: request.method(),
      resourceType: request.resourceType(),
      status,
    });
  }

  private async handlePeerMessage(rawMessage: string, peer: WebSocketPeer): Promise<void> {
    let message: ManualAgentMessage;
    try {
      message = JSON.parse(rawMessage) as ManualAgentMessage;
    } catch {
      peer.sendJson({ type: 'agent:error', payload: { message: 'Invalid JSON message' } });
      return;
    }

    try {
      const result = await this.handleCommand(message);
      peer.sendJson({
        type: 'agent:ack',
        requestId: message.requestId,
        payload: result,
      });
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error);
      peer.sendJson({
        type: 'agent:error',
        requestId: message.requestId,
        payload: { message: detail },
      });
    }
  }

  private async handleCommand(message: ManualAgentMessage): Promise<Record<string, unknown>> {
    switch (message.type) {
      case 'session:start':
        return this.captureAndBroadcast('session-start', {
          label: payloadString(message.payload, 'label') || 'Manual testing checkpoint started',
          note: payloadString(message.payload, 'note'),
        });
      case 'step:note':
        return this.captureAndBroadcast('note', {
          label: payloadString(message.payload, 'label') || 'Tester note',
          note: payloadString(message.payload, 'note') || '',
          category: payloadString(message.payload, 'category'),
        });
      case 'screenshot:capture':
        return this.captureAndBroadcast('screenshot', {
          label: payloadString(message.payload, 'label') || 'Screenshot captured',
          note: payloadString(message.payload, 'note'),
        });
      case 'checkpoint:add':
        return this.captureAndBroadcast('checkpoint', {
          label: payloadString(message.payload, 'label') || 'Checkpoint',
          note: payloadString(message.payload, 'note'),
          category: payloadString(message.payload, 'category'),
        });
      case 'bug:mark':
        return this.captureAndBroadcast('bug', {
          label: payloadString(message.payload, 'label') || 'Bug marked',
          note: payloadString(message.payload, 'note') || '',
          category: payloadString(message.payload, 'category') || 'bug',
          severity: payloadString(message.payload, 'severity') || 'medium',
        });
      case 'cursor:toggle': {
        const visible = payloadBoolean(message.payload, 'visible') ?? !this.session.cursorVisible;
        await this.setCursorVisible(visible);
        return this.captureAndBroadcast('cursor', {
          label: visible ? 'Cursor overlay shown' : 'Cursor overlay hidden',
          cursorVisible: visible,
        });
      }
      case 'session:pause':
        this.pausedByController = true;
        this.session.status = 'paused';
        await this.setControllerState('paused', { note: payloadString(message.payload, 'note') });
        return this.captureAndBroadcast('pause', {
          label: 'Manual session paused',
          note: payloadString(message.payload, 'note'),
        });
      case 'session:resume':
        this.pausedByController = false;
        this.session.status = 'running';
        this.wakeControlWaiters();
        await this.setControllerState('recording', { note: payloadString(message.payload, 'note') });
        return this.captureAndBroadcast('resume', {
          label: 'Manual session resumed',
          note: payloadString(message.payload, 'note'),
        });
      case 'tutorial:step-forward':
        this.wakeControlWaiters();
        this.server?.broadcastJson({
          type: 'tutorial:advanced',
          payload: {
            timestamp: new Date().toISOString(),
          },
        });
        return { advanced: true };
      case 'agent:status':
        return {
          sessionId: this.session.id,
          status: this.session.status,
          controllerState: this.session.controllerState,
          cursorVisible: this.session.cursorVisible,
          reportDir: this.session.reportDir,
        };
      case 'session:stop': {
        this.stopRequested = true;
        this.wakeControlWaiters();
        const report = await this.finish('completed');
        return {
          sessionId: report.sessionId,
          htmlUrl: report.htmlUrl,
          zipPath: report.zipPath,
        };
      }
      default:
        throw new Error(`Unsupported manual agent command: ${message.type}`);
    }
  }

  private async captureAndBroadcast(
    kind: ManualStepKind,
    payload: ManualCapturePayload,
  ): Promise<Record<string, unknown>> {
    const step = await this.recordEvidence(kind, payload);
    return { stepId: step.id, status: this.session.status };
  }

  private async captureStep(
    kind: ManualStepKind,
    payload: ManualCapturePayload,
  ): Promise<ManualStep> {
    this.stepCounter += 1;
    const id = `step-${String(this.stepCounter).padStart(4, '0')}`;
    const safeLabel = sanitizeFilePart(payload.label || kind);
    const page = await this.resolveTargetPage();
    const screenshotPath = path.join(
      this.session.reportDir,
      this.session.artifacts.screenshotsDir,
      `${id}-${safeLabel}.png`,
    );
    const domPath = path.join(
      this.session.reportDir,
      this.session.artifacts.domSnapshotsDir,
      `${id}-${safeLabel}.html`,
    );

    let url: string | undefined;
    let title: string | undefined;
    let viewport = this.options.viewport;
    let screenshot: string | undefined;
    let domSnapshot: string | undefined;

    if (page && !page.isClosed()) {
      url = page.url();
      title = await page.title().catch(() => undefined);
      viewport = page.viewportSize() || viewport;
      await this.hideNoCaptureElements(page);
      await page.screenshot({ path: screenshotPath, fullPage: true }).catch(() => undefined);
      if (fs.existsSync(screenshotPath)) {
        screenshot = toRelativeArtifact(this.session.reportDir, screenshotPath);
        const latestScreenshotPath = path.join(this.session.reportDir, 'screenshot.png');
        fs.copyFileSync(screenshotPath, latestScreenshotPath);
        this.session.artifacts.latestScreenshot = 'screenshot.png';
      }

      const content = await page.content().catch(() => undefined);
      if (content) {
        fs.writeFileSync(domPath, content, 'utf8');
        domSnapshot = toRelativeArtifact(this.session.reportDir, domPath);
      }
      await this.restoreNoCaptureElements(page);
    }

    const step: ManualStep = {
      id,
      kind,
      label: payload.label || kind,
      timestamp: new Date().toISOString(),
      url,
      title,
      viewport,
      note: payload.note,
      category: payload.category,
      severity: payload.severity,
      cursorVisible: payload.cursorVisible,
      screenshot,
      domSnapshot,
      consoleLogCount: this.session.consoleLogs.length,
      networkIssueCount: this.session.networkIssues.length,
    };
    this.session.steps.push(step);
    return step;
  }

  private async setCursorVisible(visible: boolean): Promise<void> {
    this.session.cursorVisible = visible;
    const pages = this.context?.pages() || [];

    await Promise.all(pages.map(async (page) => {
      if (page.isClosed() || isInternalPage(page.url())) {
        return;
      }

      await page.evaluate((isVisible) => {
        const browserGlobal = globalThis as unknown as {
          CustomEvent: new (type: string, init: { detail: unknown }) => Event;
          dispatchEvent: (event: Event) => boolean;
        };
        browserGlobal.dispatchEvent(new browserGlobal.CustomEvent('__testing_companion_cursor', {
          detail: { visible: isVisible },
        }));
      }, visible).catch(() => undefined);
    }));

    this.server?.broadcastJson({
      type: 'cursor:state',
      payload: { visible },
    });
  }

  private async resolveTargetPage(): Promise<Page | undefined> {
    const pages = this.context?.pages().filter((page) => {
      return !page.isClosed() && !isInternalPage(page.url());
    }) || [];

    return pages[pages.length - 1];
  }

  private async finishInternal(
    status: 'completed' | 'interrupted',
  ): Promise<ManualReportResult> {
    try {
      this.session.status = 'stopping';
      await this.setControllerState('stopping');
      await this.captureStep('session-stop', {
        label: status === 'completed' ? 'Manual session stopped' : 'Manual session interrupted',
      });

      const tracePath = path.join(this.session.reportDir, 'trace.zip');
      await this.context?.tracing.stop({ path: tracePath }).catch(() => undefined);
      if (fs.existsSync(tracePath)) {
        this.session.artifacts.trace = toRelativeArtifact(this.session.reportDir, tracePath);
      }

      await this.closeTargetPages();
      this.collectVideoArtifacts();

      this.session.status = status;
      this.session.endedAt = new Date().toISOString();
      this.session.controllerState = 'report-ready';
      const report = await createManualReport(this.session);
      await this.setControllerState('report-ready', {
        sessionId: report.sessionId,
        htmlUrl: report.htmlUrl,
        zipPath: report.zipPath,
        reportDir: report.reportDir,
      });

      this.server?.broadcastJson({
        type: 'report:ready',
        payload: {
          sessionId: report.sessionId,
          htmlUrl: report.htmlUrl,
          htmlPath: report.htmlPath,
          zipPath: report.zipPath,
          reportDir: report.reportDir,
        },
      });

      await new Promise((resolve) => setTimeout(resolve, 350));
      await this.shutdown();
      this.completionResolve?.(report);
      return report;
    } catch (error) {
      this.session.status = 'failed';
      const normalized = error instanceof Error ? error : new Error(String(error));
      await this.setControllerState('error', { message: normalized.message });
      this.completionReject?.(normalized);
      throw normalized;
    }
  }

  private async closeTargetPages(): Promise<void> {
    const pages = this.context?.pages() || [];
    for (const page of pages) {
      if (!page.isClosed() && !isInternalPage(page.url())) {
        await page.close().catch(() => undefined);
      }
    }
  }

  private collectVideoArtifacts(): void {
    const videosDir = path.join(this.session.reportDir, 'video');
    if (!fs.existsSync(videosDir)) {
      return;
    }

    const videoFiles = fs
      .readdirSync(videosDir)
      .filter((entry) => entry.endsWith('.webm'))
      .sort();

    const primary = videoFiles
      .map((entry) => ({
        entry,
        size: fs.statSync(path.join(videosDir, entry)).size,
      }))
      .sort((left, right) => right.size - left.size)[0];

    if (primary && primary.entry !== 'video.webm') {
      fs.copyFileSync(
        path.join(videosDir, primary.entry),
        path.join(videosDir, 'video.webm'),
      );
      videoFiles.push('video.webm');
    }

    this.session.artifacts.primaryVideo = fs.existsSync(path.join(videosDir, 'video.webm'))
      ? 'video/video.webm'
      : undefined;
    this.session.artifacts.videos = [...new Set(videoFiles)]
      .sort()
      .map((entry) => `video/${entry}`);
  }

  private async hideNoCaptureElements(page: Page): Promise<void> {
    await page.evaluate(() => {
      const browserGlobal = globalThis as unknown as {
        document: {
          querySelectorAll: (selector: string) => any[];
        };
      };
      const selector = '[data-testing-companion-transient="true"], .testing-companion-no-capture';
      Array.from(browserGlobal.document.querySelectorAll(selector)).forEach((element) => {
        if (element.hasAttribute('data-testing-companion-capture-hidden')) {
          return;
        }
        element.setAttribute('data-testing-companion-capture-hidden', 'true');
        element.setAttribute('data-testing-companion-previous-display', element.style.display || '');
        element.style.display = 'none';
      });
    }).catch(() => undefined);
  }

  private async restoreNoCaptureElements(page: Page): Promise<void> {
    await page.evaluate(() => {
      const browserGlobal = globalThis as unknown as {
        document: {
          querySelectorAll: (selector: string) => any[];
        };
      };
      Array.from(browserGlobal.document.querySelectorAll('[data-testing-companion-capture-hidden="true"]'))
        .forEach((element) => {
          const previousDisplay = element.getAttribute('data-testing-companion-previous-display') || '';
          element.style.display = previousDisplay;
          element.removeAttribute('data-testing-companion-capture-hidden');
          element.removeAttribute('data-testing-companion-previous-display');
        });
    }).catch(() => undefined);
  }

  private async shutdown(): Promise<void> {
    await this.context?.close().catch(() => undefined);
    await this.server?.close().catch(() => undefined);
  }

  private waitForControlSignal(): Promise<void> {
    return new Promise((resolve) => {
      const wrapped = (): void => {
        this.controlResolvers.delete(wrapped);
        resolve();
      };
      this.controlResolvers.add(wrapped);
    });
  }

  private waitForControlSignalOrTimeout(milliseconds: number): Promise<void> {
    return new Promise((resolve) => {
      let settled = false;
      let wrapped: () => void;
      const timeout = setTimeout(() => {
        if (settled) {
          return;
        }
        settled = true;
        this.controlResolvers.delete(wrapped);
        resolve();
      }, milliseconds);

      wrapped = (): void => {
        if (settled) {
          return;
        }
        settled = true;
        clearTimeout(timeout);
        this.controlResolvers.delete(wrapped);
        resolve();
      };

      this.controlResolvers.add(wrapped);
    });
  }

  private wakeControlWaiters(): void {
    const resolvers = [...this.controlResolvers];
    this.controlResolvers.clear();
    resolvers.forEach((resolve) => resolve());
  }
}

export function getDefaultManualOptions(): ManualSessionOptions {
  const reportRoot = path.join(PROJECT_ROOT, 'test-artifacts');
  const resolveProjectPath = (value: string | undefined, fallback: string): string => {
    if (!value) {
      return fallback;
    }
    return path.isAbsolute(value) ? value : path.resolve(PROJECT_ROOT, value);
  };

  return {
    targetUrl: process.env.MANUAL_TARGET_URL || process.env.BASE_URL || 'https://www.saucedemo.com/',
    baseURL: process.env.MANUAL_BASE_URL || getBaseURL(process.env.MANUAL_TARGET_URL || process.env.BASE_URL || 'https://www.saucedemo.com/'),
    port: Number(process.env.MANUAL_AGENT_PORT || 3737),
    reportRoot: resolveProjectPath(process.env.MANUAL_REPORT_ROOT, reportRoot),
    userDataDir: resolveProjectPath(
      process.env.MANUAL_PROFILE_DIR,
      path.join(PROJECT_ROOT, 'test-artifacts', 'manual-profile'),
    ),
    extensionDir: resolveProjectPath(
      process.env.MANUAL_EXTENSION_DIR,
      path.join(PROJECT_ROOT, 'extension'),
    ),
    sessionName: process.env.MANUAL_SESSION_NAME,
    proxy: process.env.MANUAL_PROXY || undefined,
    browserChannel: process.env.MANUAL_BROWSER_CHANNEL || undefined,
    viewport: {
      width: Number(process.env.MANUAL_VIEWPORT_WIDTH || 1280),
      height: Number(process.env.MANUAL_VIEWPORT_HEIGHT || 720),
    },
  };
}

function getBaseURL(value: string): string | undefined {
  try {
    const url = new URL(value);
    return url.origin;
  } catch {
    return undefined;
  }
}
