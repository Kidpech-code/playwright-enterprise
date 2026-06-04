import fs from 'fs';
import path from 'path';
import { test, expect } from '@playwright/test';
import { createManualReport } from '../../src/manual/report';
import { ManualSessionRecord } from '../../src/manual/types';

test('manual report generator writes html, json, logs, and zip artifacts', async ({}, testInfo) => {
  const reportDir = path.join(testInfo.outputDir, 'manual-report');
  const screenshotsDir = path.join(reportDir, 'screenshots');
  const domDir = path.join(reportDir, 'snapshots');
  const videosDir = path.join(reportDir, 'video');
  fs.mkdirSync(screenshotsDir, { recursive: true });
  fs.mkdirSync(domDir, { recursive: true });
  fs.mkdirSync(videosDir, { recursive: true });

  fs.writeFileSync(path.join(screenshotsDir, 'step-0001-start.png'), 'fake image');
  fs.writeFileSync(path.join(domDir, 'step-0001-start.html'), '<main>Fake DOM</main>');
  fs.writeFileSync(path.join(videosDir, 'session.webm'), 'fake video');
  fs.writeFileSync(path.join(reportDir, 'trace.zip'), 'fake trace');

  const session: ManualSessionRecord = {
    id: 'manual-test-session',
    name: 'Manual Report Validation',
    targetUrl: 'https://example.com',
    status: 'completed',
    startedAt: '2026-06-04T00:00:00.000Z',
    endedAt: '2026-06-04T00:01:00.000Z',
    reportDir,
    agentPort: 3737,
    cursorVisible: true,
    steps: [
      {
        id: 'step-0001',
        kind: 'checkpoint',
        label: 'Landing page reviewed',
        timestamp: '2026-06-04T00:00:10.000Z',
        url: 'https://example.com',
        title: 'Example',
        viewport: { width: 1280, height: 720 },
        note: 'Looks ready',
        screenshot: 'screenshots/step-0001-start.png',
        domSnapshot: 'snapshots/step-0001-start.html',
        consoleLogCount: 1,
        networkIssueCount: 1,
      },
    ],
    consoleLogs: [
      {
        timestamp: '2026-06-04T00:00:05.000Z',
        type: 'log',
        message: 'hello',
        url: 'https://example.com',
      },
    ],
    networkIssues: [
      {
        timestamp: '2026-06-04T00:00:06.000Z',
        url: 'https://example.com/missing.png',
        method: 'GET',
        resourceType: 'image',
        status: 404,
      },
    ],
    artifacts: {
      htmlReport: undefined,
      summaryReport: undefined,
      zipBundle: undefined,
      trace: 'trace.zip',
      videos: ['video/session.webm'],
      screenshotsDir: 'screenshots',
      domSnapshotsDir: 'snapshots',
    },
  };

  const report = await createManualReport(session);

  expect(fs.existsSync(report.htmlPath)).toBe(true);
  expect(path.basename(report.htmlPath)).toBe('summary.html');
  expect(fs.existsSync(path.join(reportDir, 'index.html'))).toBe(true);
  expect(fs.existsSync(path.join(reportDir, 'manual-session.json'))).toBe(true);
  expect(fs.existsSync(path.join(reportDir, 'log.json'))).toBe(true);
  expect(fs.existsSync(path.join(reportDir, 'logs.json'))).toBe(true);
  expect(fs.existsSync(report.zipPath)).toBe(true);

  const html = fs.readFileSync(report.htmlPath, 'utf8');
  expect(html).toContain('Manual Report Validation');
  expect(html).toContain('Landing page reviewed');
  expect(html).toContain('Report ZIP');

  const zip = fs.readFileSync(report.zipPath);
  expect(zip.includes(Buffer.from('manual-session.json'))).toBe(true);
  expect(zip.includes(Buffer.from('summary.html'))).toBe(true);
  expect(zip.includes(Buffer.from('index.html'))).toBe(true);
  expect(zip.includes(Buffer.from('log.json'))).toBe(true);
  expect(zip.includes(Buffer.from('logs.json'))).toBe(true);
  expect(zip.includes(Buffer.from('video/session.webm'))).toBe(true);
  expect(zip.includes(Buffer.from('snapshots/step-0001-start.html'))).toBe(true);
});
