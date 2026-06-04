import { Page, Locator } from '@playwright/test';
import { BasePage } from '../base/BasePage';

export class CatalogPage extends BasePage {
  readonly productItems: Locator;
  readonly cartBadge: Locator;
  readonly sortDropdown: Locator;
  readonly cartLink: Locator;
  readonly pageTitle: Locator;

  constructor(page: Page) {
    super(page);
    this.productItems = page.locator('.inventory_item');
    this.cartBadge    = page.locator('.shopping_cart_badge');
    this.sortDropdown = page.locator('[data-test="product-sort-container"]');
    this.cartLink     = page.locator('.shopping_cart_link');
    this.pageTitle    = page.locator('.title');
  }

  async getProductCount(): Promise<number> {
    return this.productItems.count();
  }

  async getProductNames(): Promise<string[]> {
    return this.productItems.locator('.inventory_item_name').allTextContents();
  }

  async getProductPrices(): Promise<number[]> {
    const texts = await this.productItems.locator('.inventory_item_price').allTextContents();
    return texts.map(t => parseFloat(t.replace('$', '')));
  }

  async sortBy(option: 'az' | 'za' | 'lohi' | 'hilo'): Promise<void> {
    await this.selectOption(this.sortDropdown, option, 'sort-dropdown');
  }

  async addToCartByIndex(index: number): Promise<void> {
    await this.click(
      this.productItems.nth(index).locator('button[data-test^="add-to-cart"]'),
      `add-to-cart-${index}`
    );
  }

  async removeFromCartByIndex(index: number): Promise<void> {
    await this.click(
      this.productItems.nth(index).locator('button[data-test^="remove"]'),
      `remove-${index}`
    );
  }

  async clickProductNameByIndex(index: number): Promise<void> {
    await this.click(
      this.productItems.nth(index).locator('.inventory_item_name'),
      `product-name-${index}`
    );
  }

  async clickProductTitleLinkByIndex(index: number): Promise<void> {
    await this.click(
      this.productItems.nth(index).locator('a[data-test$="-title-link"]'),
      `product-title-link-${index}`
    );
  }

  async clickProductImageByIndex(index: number): Promise<void> {
    await this.click(
      this.productItems.nth(index).locator('.inventory_item_img img'),
      `product-image-${index}`
    );
  }

  async clickCartIcon(): Promise<void> {
    await this.click(this.cartLink, 'cart-icon');
  }

  async getCartBadgeCount(): Promise<number> {
    const text = await this.cartBadge.textContent();
    return parseInt(text ?? '0', 10);
  }

  async isCartBadgeVisible(): Promise<boolean> {
    return this.cartBadge.isVisible();
  }
}
