import { Page, test } from '@playwright/test';
import path from 'path';
import fs from 'fs';

const PROJECT_ROOT = path.resolve(__dirname, '..', '..', '..');

export async function captureStepScreenshot(page: Page, label: string): Promise<void> {
  let testInfo;
  try {
    testInfo = test.info();
  } catch {
    return;
  }

  const stepNumber = String(testInfo.attachments.length + 1).padStart(3, '0');
  const safeLabel = label.replace(/[^a-z0-9-]/gi, '-').toLowerCase();
  const fileName = `step-${stepNumber}-${safeLabel}.png`;

  const dir = path.join(
    PROJECT_ROOT, 'reports', 'screenshots',
    testInfo.project.name,
    testInfo.title.replace(/[^a-z0-9-]/gi, '-')
  );
  fs.mkdirSync(dir, { recursive: true });

  const fullPath = path.join(dir, fileName);
  await page.screenshot({ path: fullPath, fullPage: true });
  await testInfo.attach(fileName, { path: fullPath, contentType: 'image/png' });
}
