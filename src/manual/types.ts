export type ManualSessionStatus =
  | 'created'
  | 'running'
  | 'paused'
  | 'stopping'
  | 'completed'
  | 'interrupted'
  | 'failed';

export type ManualControllerState =
  | 'idle'
  | 'preparing'
  | 'recording'
  | 'paused'
  | 'capturing'
  | 'stopping'
  | 'report-ready'
  | 'error';

export type ManualStepKind =
  | 'session-start'
  | 'note'
  | 'screenshot'
  | 'checkpoint'
  | 'bug'
  | 'cursor'
  | 'pause'
  | 'resume'
  | 'session-stop';

export interface ManualCapturePayload {
  label?: string;
  note?: string;
  category?: string;
  severity?: string;
  cursorVisible?: boolean;
}

export interface ManualViewport {
  width: number;
  height: number;
}

export interface ManualLogEntry {
  timestamp: string;
  type: string;
  message: string;
  url?: string;
  location?: string;
}

export interface ManualNetworkEntry {
  timestamp: string;
  url: string;
  method: string;
  resourceType: string;
  status?: number;
  failure?: string;
}

export interface ManualStep {
  id: string;
  kind: ManualStepKind;
  label: string;
  timestamp: string;
  url?: string;
  title?: string;
  viewport?: ManualViewport;
  note?: string;
  category?: string;
  severity?: string;
  cursorVisible?: boolean;
  screenshot?: string;
  domSnapshot?: string;
  consoleLogCount: number;
  networkIssueCount: number;
}

export interface ManualSessionArtifacts {
  htmlReport?: string;
  summaryReport?: string;
  zipBundle?: string;
  trace?: string;
  videos: string[];
  primaryVideo?: string;
  screenshotsDir: string;
  domSnapshotsDir: string;
  latestScreenshot?: string;
  logsFile?: string;
}

export interface ManualSessionRecord {
  id: string;
  name: string;
  targetUrl: string;
  status: ManualSessionStatus;
  controllerState?: ManualControllerState;
  startedAt: string;
  endedAt?: string;
  reportDir: string;
  agentPort: number;
  cursorVisible: boolean;
  steps: ManualStep[];
  consoleLogs: ManualLogEntry[];
  networkIssues: ManualNetworkEntry[];
  artifacts: ManualSessionArtifacts;
}

export interface ManualReportResult {
  sessionId: string;
  reportDir: string;
  htmlPath: string;
  htmlUrl: string;
  zipPath: string;
}

export interface ManualAgentMessage {
  type: string;
  requestId?: string;
  payload?: Record<string, unknown>;
}
