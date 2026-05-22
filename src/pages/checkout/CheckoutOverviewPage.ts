import { Page, Locator } from '@playwright/test';
import { BasePage } from '../base/BasePage';

export class CheckoutOverviewPage extends BasePage {
  readonly cartItems: Locator;
  readonly subtotalLabel: Locator;
  readonly taxLabel: Locator;
  readonly totalLabel: Locator;
  private readonly finishButton: Locator;
  private readonly cancelButton: Locator;

  constructor(page: Page) {
    super(page);
    this.cartItems     = page.locator('.cart_item');
    this.subtotalLabel = page.locator('.summary_subtotal_label');
    this.taxLabel      = page.locator('.summary_tax_label');
    this.totalLabel    = page.locator('.summary_total_label');
    this.finishButton  = page.locator('[data-test="finish"]');
    this.cancelButton  = page.locator('[data-test="cancel"]');
  }

  async getItemCount(): Promise<number> {
    return this.cartItems.count();
  }

  async getSubtotal(): Promise<number> {
    const text = await this.subtotalLabel.textContent() ?? '';
    return parseFloat(text.replace(/[^0-9.]/g, ''));
  }

  async clickFinish(): Promise<void> {
    await this.click(this.finishButton, 'finish');
  }

  async clickCancel(): Promise<void> {
    await this.click(this.cancelButton, 'cancel-overview');
  }
}
