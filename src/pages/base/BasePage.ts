import { Page, Locator, test } from '@playwright/test';
import { captureStepScreenshot } from '../../helpers/screenshot.helper';

export abstract class BasePage {
  constructor(protected readonly page: Page) {}

  protected async navigate(url: string): Promise<void> {
    await this.runStep(`Navigate to ${url}`, async () => {
      await this.page.goto(url, { waitUntil: 'domcontentloaded' });
      await captureStepScreenshot(this.page, 'navigate');
    });
  }

  protected async click(locator: Locator, label: string): Promise<void> {
    await this.runStep(`Click: ${label}`, async () => {
      await locator.click();
      await captureStepScreenshot(this.page, `click-${label}`);
    });
  }

  protected async fill(locator: Locator, value: string, label: string): Promise<void> {
    await this.runStep(`Fill ${label}`, async () => {
      await locator.fill(value);
      await captureStepScreenshot(this.page, `fill-${label}`);
    });
  }

  protected async selectOption(locator: Locator, value: string, label: string): Promise<void> {
    await this.runStep(`Select "${value}" in ${label}`, async () => {
      await locator.selectOption(value);
      await captureStepScreenshot(this.page, `select-${label}`);
    });
  }

  private async runStep(title: string, body: () => Promise<void>): Promise<void> {
    try {
      await test.step(title, body);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (!message.includes('test.step() can only be called from a test')) {
        throw error;
      }
      await body();
    }
  }
}
