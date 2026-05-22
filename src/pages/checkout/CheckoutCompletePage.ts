import { Page, Locator } from '@playwright/test';
import { BasePage } from '../base/BasePage';

export class CheckoutCompletePage extends BasePage {
  readonly completeHeader: Locator;
  readonly completeText: Locator;
  private readonly backHomeButton: Locator;

  constructor(page: Page) {
    super(page);
    this.completeHeader = page.locator('.complete-header');
    this.completeText   = page.locator('.complete-text');
    this.backHomeButton = page.locator('[data-test="back-to-products"]');
  }

  async clickBackHome(): Promise<void> {
    await this.click(this.backHomeButton, 'back-to-products');
  }
}
