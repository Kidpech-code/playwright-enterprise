import { Page, Locator } from '@playwright/test';
import { BasePage } from '../base/BasePage';

export class CartPage extends BasePage {
  readonly cartItems: Locator;
  readonly cartBadge: Locator;
  private readonly continueShoppingButton: Locator;
  private readonly checkoutButton: Locator;

  constructor(page: Page) {
    super(page);
    this.cartItems              = page.locator('.cart_item');
    this.cartBadge              = page.locator('.shopping_cart_badge');
    this.continueShoppingButton = page.locator('[data-test="continue-shopping"]');
    this.checkoutButton         = page.locator('[data-test="checkout"]');
  }

  async open(): Promise<void> {
    await this.navigate('/cart.html');
  }

  async getItemCount(): Promise<number> {
    return this.cartItems.count();
  }

  async getItemNames(): Promise<string[]> {
    return this.cartItems.locator('.inventory_item_name').allTextContents();
  }

  async getItemPrices(): Promise<number[]> {
    const texts = await this.cartItems.locator('.inventory_item_price').allTextContents();
    return texts.map(t => parseFloat(t.replace('$', '')));
  }

  async removeItemByIndex(index: number): Promise<void> {
    await this.click(
      this.cartItems.nth(index).locator('button[data-test^="remove"]'),
      `remove-item-${index}`
    );
  }

  async clickContinueShopping(): Promise<void> {
    await this.click(this.continueShoppingButton, 'continue-shopping');
  }

  async clickCheckout(): Promise<void> {
    await this.click(this.checkoutButton, 'checkout');
  }

  async getCartBadgeCount(): Promise<number> {
    const text = await this.cartBadge.textContent();
    return parseInt(text ?? '0', 10);
  }
}
