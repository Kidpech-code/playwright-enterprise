import { Page, Locator } from '@playwright/test';
import { BasePage } from '../base/BasePage';

export class ProductDetailPage extends BasePage {
  readonly productName: Locator;
  readonly productDescription: Locator;
  readonly productPrice: Locator;
  readonly addToCartButton: Locator;
  readonly removeButton: Locator;
  readonly backButton: Locator;
  readonly cartBadge: Locator;

  constructor(page: Page) {
    super(page);
    this.productName        = page.locator('.inventory_details_name');
    this.productDescription = page.locator('.inventory_details_desc');
    this.productPrice       = page.locator('.inventory_details_price');
    this.addToCartButton    = page.locator('[data-test="add-to-cart"]');
    this.removeButton       = page.locator('[data-test^="remove"]');
    this.backButton         = page.locator('[data-test="back-to-products"]');
    this.cartBadge          = page.locator('.shopping_cart_badge');
  }

  async addToCart(): Promise<void> {
    await this.click(this.addToCartButton, 'add-to-cart');
  }

  async clickBack(): Promise<void> {
    await this.click(this.backButton, 'back-to-products');
  }

  async getCartBadgeCount(): Promise<number> {
    const text = await this.cartBadge.textContent();
    return parseInt(text ?? '0', 10);
  }
}
