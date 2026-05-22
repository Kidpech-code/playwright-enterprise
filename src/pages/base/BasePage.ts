import { Page, Locator, test } from '@playwright/test';
import { captureStepScreenshot } from '../../helpers/screenshot.helper';

export abstract class BasePage {
  constructor(protected readonly page: Page) {}

  protected async navigate(url: string): Promise<void> {
    await test.step(`Navigate to ${url}`, async () => {
      await this.page.goto(url, { waitUntil: 'domcontentloaded' });
      await captureStepScreenshot(this.page, 'navigate');
    });
  }

  protected async click(locator: Locator, label: string): Promise<void> {
    await test.step(`Click: ${label}`, async () => {
      await locator.click();
      await captureStepScreenshot(this.page, `click-${label}`);
    });
  }

  protected async fill(locator: Locator, value: string, label: string): Promise<void> {
    await test.step(`Fill ${label}`, async () => {
      await locator.fill(value);
      await captureStepScreenshot(this.page, `fill-${label}`);
    });
  }

  protected async selectOption(locator: Locator, value: string, label: string): Promise<void> {
    await test.step(`Select "${value}" in ${label}`, async () => {
      await locator.selectOption(value);
      await captureStepScreenshot(this.page, `select-${label}`);
    });
  }
}
