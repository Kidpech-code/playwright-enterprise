import fs from 'fs';
import path from 'path';
import {
  ManualReportResult,
  ManualSessionRecord,
  ManualStep,
} from './types';
import { createZipFromDirectory } from './zip';
import {
  ensureDir,
  escapeHtml,
  formatDuration,
  toFileUrl,
  writeJson,
} from './utils';

function stepBadgeClass(kind: ManualStep['kind']): string {
  if (kind === 'bug') {
    return 'danger';
  }
  if (kind === 'checkpoint' || kind === 'session-start' || kind === 'session-stop') {
    return 'strong';
  }
  if (kind === 'cursor' || kind === 'pause' || kind === 'resume') {
    return 'muted';
  }
  return 'default';
}

function renderArtifactLink(label: string, href?: string): string {
  if (!href) {
    return '';
  }
  return `<a class="artifact-link" href="${escapeHtml(href)}">${escapeHtml(label)}</a>`;
}

function renderStep(step: ManualStep): string {
  const note = step.note ? `<p>${escapeHtml(step.note)}</p>` : '';
  const meta = [
    step.url ? `URL: ${escapeHtml(step.url)}` : undefined,
    step.title ? `Title: ${escapeHtml(step.title)}` : undefined,
    step.viewport ? `Viewport: ${step.viewport.width} x ${step.viewport.height}` : undefined,
    step.severity ? `Severity: ${escapeHtml(step.severity)}` : undefined,
    step.category ? `Category: ${escapeHtml(step.category)}` : undefined,
    `Console logs: ${step.consoleLogCount}`,
    `Network issues: ${step.networkIssueCount}`,
  ].filter(Boolean);

  const screenshot = step.screenshot
    ? `<a href="${escapeHtml(step.screenshot)}"><img src="${escapeHtml(step.screenshot)}" alt="${escapeHtml(step.label)} screenshot"></a>`
    : '<div class="empty-shot">No screenshot captured</div>';

  return `
    <article class="step">
      <div class="step-main">
        <div class="step-heading">
          <span class="badge ${stepBadgeClass(step.kind)}">${escapeHtml(step.kind)}</span>
          <h3>${escapeHtml(step.label)}</h3>
        </div>
        <time>${escapeHtml(step.timestamp)}</time>
        ${note}
        <dl>
          ${meta.map((item) => `<div><dt>${item?.split(':')[0]}</dt><dd>${item?.split(':').slice(1).join(':').trim()}</dd></div>`).join('')}
        </dl>
        <div class="step-links">
          ${renderArtifactLink('DOM snapshot', step.domSnapshot)}
          ${renderArtifactLink('Screenshot', step.screenshot)}
        </div>
      </div>
      <div class="step-shot">${screenshot}</div>
    </article>
  `;
}

function renderFileLayout(session: ManualSessionRecord): string {
  return [
    `${path.basename(session.reportDir)}/`,
    '|-- summary.html',
    '|-- index.html',
    '|-- manual-session.json',
    `|-- ${session.artifacts.logsFile || 'log.json'}`,
    '|-- screenshot.png',
    '|-- trace.zip',
    '|-- video/',
    '|-- screenshots/',
    '|-- snapshots/',
    `|-- ${session.artifacts.zipBundle || `${session.id}.zip`}`,
  ].join('\n');
}

function renderReportHtml(session: ManualSessionRecord): string {
  const videos = session.artifacts.videos
    .map((video) => `
      <article class="video-item">
        <video controls preload="metadata" src="${escapeHtml(video)}"></video>
        <a href="${escapeHtml(video)}">${escapeHtml(video)}</a>
      </article>
    `)
    .join('');
  const consoleIssues = session.consoleLogs.length;
  const networkIssues = session.networkIssues.length;
  const bugCount = session.steps.filter((step) => step.kind === 'bug').length;

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(session.name)} - Manual Test Report</title>
  <style>
    :root {
      color-scheme: light;
      --ink: #18212f;
      --muted: #667085;
      --line: #d9e2ec;
      --panel: #ffffff;
      --canvas: #f6f8fb;
      --accent: #0f766e;
      --danger: #b42318;
      --warning: #b54708;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      color: var(--ink);
      background: var(--canvas);
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      line-height: 1.45;
    }
    header {
      background: #111827;
      color: #f9fafb;
      padding: 32px max(24px, calc((100vw - 1120px) / 2));
    }
    header h1 {
      margin: 0 0 10px;
      font-size: 30px;
      letter-spacing: 0;
    }
    header p {
      margin: 0;
      color: #cbd5e1;
      max-width: 920px;
    }
    main {
      max-width: 1120px;
      margin: 0 auto;
      padding: 24px;
    }
    .summary {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
      gap: 12px;
      margin-bottom: 24px;
    }
    .metric, .artifacts, .logs, .step {
      background: var(--panel);
      border: 1px solid var(--line);
      border-radius: 8px;
    }
    .metric { padding: 16px; }
    .metric span {
      display: block;
      color: var(--muted);
      font-size: 13px;
      margin-bottom: 6px;
    }
    .metric strong {
      display: block;
      font-size: 24px;
      line-height: 1.1;
    }
    section h2 {
      margin: 28px 0 12px;
      font-size: 18px;
      letter-spacing: 0;
    }
    .artifacts, .logs {
      padding: 16px;
    }
    .artifact-list {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      margin: 0;
      padding: 0;
      list-style: none;
    }
    .artifact-link {
      display: inline-flex;
      align-items: center;
      min-height: 34px;
      padding: 7px 10px;
      border: 1px solid var(--line);
      border-radius: 6px;
      color: var(--accent);
      text-decoration: none;
      background: #f8fafc;
      font-weight: 600;
    }
    .video-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
      gap: 12px;
      margin-top: 12px;
    }
    .video-item {
      display: grid;
      gap: 8px;
    }
    .video-item video {
      width: 100%;
      aspect-ratio: 16 / 9;
      background: #111827;
      border: 1px solid var(--line);
      border-radius: 6px;
    }
    .timeline {
      display: grid;
      gap: 14px;
    }
    .step {
      display: grid;
      grid-template-columns: minmax(0, 1.1fr) minmax(280px, .9fr);
      gap: 16px;
      padding: 16px;
    }
    .step-heading {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 6px;
    }
    .step h3 {
      margin: 0;
      font-size: 16px;
      letter-spacing: 0;
    }
    .step time {
      display: block;
      color: var(--muted);
      font-size: 12px;
      margin-bottom: 10px;
    }
    .badge {
      display: inline-flex;
      align-items: center;
      min-height: 24px;
      padding: 3px 8px;
      border-radius: 999px;
      font-size: 12px;
      font-weight: 700;
      background: #eef2ff;
      color: #3538cd;
      white-space: nowrap;
    }
    .badge.danger { background: #fef3f2; color: var(--danger); }
    .badge.strong { background: #ecfdf3; color: #027a48; }
    .badge.muted { background: #f2f4f7; color: #475467; }
    dl {
      display: grid;
      gap: 6px;
      margin: 12px 0;
    }
    dl div {
      display: grid;
      grid-template-columns: 120px minmax(0, 1fr);
      gap: 10px;
      font-size: 13px;
    }
    dt {
      color: var(--muted);
      font-weight: 600;
    }
    dd {
      margin: 0;
      word-break: break-word;
    }
    .step-links {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
    .step-shot img, .empty-shot {
      width: 100%;
      aspect-ratio: 16 / 9;
      object-fit: cover;
      border: 1px solid var(--line);
      border-radius: 6px;
      background: #eef2f6;
    }
    .empty-shot {
      display: grid;
      place-items: center;
      color: var(--muted);
    }
    pre {
      overflow: auto;
      max-height: 320px;
      padding: 12px;
      background: #101828;
      color: #f9fafb;
      border-radius: 6px;
      font-size: 12px;
    }
    .layout {
      margin-top: 12px;
    }
    @media (max-width: 820px) {
      .step { grid-template-columns: 1fr; }
      dl div { grid-template-columns: 1fr; }
    }
  </style>
</head>
<body>
  <header>
    <h1>${escapeHtml(session.name)}</h1>
    <p>Manual testing report for ${escapeHtml(session.targetUrl)}. Session ${escapeHtml(session.id)} started ${escapeHtml(session.startedAt)}.</p>
  </header>
  <main>
    <section class="summary" aria-label="Summary">
      <div class="metric"><span>Status</span><strong>${escapeHtml(session.status)}</strong></div>
      <div class="metric"><span>Duration</span><strong>${escapeHtml(formatDuration(session.startedAt, session.endedAt))}</strong></div>
      <div class="metric"><span>Steps</span><strong>${session.steps.length}</strong></div>
      <div class="metric"><span>Bugs</span><strong>${bugCount}</strong></div>
      <div class="metric"><span>Console Logs</span><strong>${consoleIssues}</strong></div>
      <div class="metric"><span>Network Issues</span><strong>${networkIssues}</strong></div>
    </section>

    <section>
      <h2>Artifacts</h2>
      <div class="artifacts">
        <ul class="artifact-list">
          <li>${renderArtifactLink('Session JSON', 'manual-session.json')}</li>
          <li>${renderArtifactLink('Logs JSON', session.artifacts.logsFile)}</li>
          <li>${renderArtifactLink('Trace ZIP', session.artifacts.trace)}</li>
          <li>${renderArtifactLink('Latest Screenshot', session.artifacts.latestScreenshot)}</li>
          <li>${renderArtifactLink('Primary Video', session.artifacts.primaryVideo)}</li>
          <li>${renderArtifactLink('Report ZIP', session.artifacts.zipBundle)}</li>
        </ul>
        <pre class="layout">${escapeHtml(renderFileLayout(session))}</pre>
        ${videos ? `<h2>Video Recordings</h2><div class="video-grid">${videos}</div>` : ''}
      </div>
    </section>

    <section>
      <h2>Timeline</h2>
      <div class="timeline">
        ${session.steps.map(renderStep).join('')}
      </div>
    </section>

    <section>
      <h2>Logs</h2>
      <div class="logs">
        <pre>${escapeHtml(JSON.stringify({
          consoleLogs: session.consoleLogs,
          networkIssues: session.networkIssues,
        }, null, 2))}</pre>
      </div>
    </section>
  </main>
</body>
</html>`;
}

export async function createManualReport(
  session: ManualSessionRecord,
): Promise<ManualReportResult> {
  ensureDir(session.reportDir);

  const logsPath = path.join(session.reportDir, 'log.json');
  const legacyLogsPath = path.join(session.reportDir, 'logs.json');
  session.artifacts.logsFile = 'log.json';
  writeJson(logsPath, {
    consoleLogs: session.consoleLogs,
    networkIssues: session.networkIssues,
  });
  writeJson(legacyLogsPath, {
    consoleLogs: session.consoleLogs,
    networkIssues: session.networkIssues,
  });

  const sessionJsonPath = path.join(session.reportDir, 'manual-session.json');
  writeJson(sessionJsonPath, session);

  const htmlPath = path.join(session.reportDir, 'summary.html');
  const legacyHtmlPath = path.join(session.reportDir, 'index.html');
  fs.writeFileSync(htmlPath, renderReportHtml(session), 'utf8');
  fs.copyFileSync(htmlPath, legacyHtmlPath);
  session.artifacts.htmlReport = 'summary.html';
  session.artifacts.summaryReport = 'summary.html';

  const zipPath = path.join(session.reportDir, `${session.id}.zip`);
  session.artifacts.zipBundle = path.basename(zipPath);
  writeJson(sessionJsonPath, session);
  fs.writeFileSync(htmlPath, renderReportHtml(session), 'utf8');
  fs.copyFileSync(htmlPath, legacyHtmlPath);
  createZipFromDirectory(session.reportDir, zipPath);

  return {
    sessionId: session.id,
    reportDir: session.reportDir,
    htmlPath,
    htmlUrl: toFileUrl(htmlPath),
    zipPath,
  };
}
