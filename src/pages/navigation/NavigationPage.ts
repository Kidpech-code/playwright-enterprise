import { Page, Locator } from '@playwright/test';
import { BasePage } from '../base/BasePage';

export class NavigationPage extends BasePage {
  private readonly burgerMenuButton: Locator;
  private readonly closeMenuButton: Locator;
  private readonly allItemsLink: Locator;
  private readonly logoutLink: Locator;
  private readonly resetLink: Locator;
  readonly menuContainer: Locator;

  constructor(page: Page) {
    super(page);
    this.burgerMenuButton = page.locator('#react-burger-menu-btn');
    this.closeMenuButton  = page.locator('#react-burger-cross-btn');
    this.allItemsLink     = page.locator('#inventory_sidebar_link');
    this.logoutLink       = page.locator('#logout_sidebar_link');
    this.resetLink        = page.locator('#reset_sidebar_link');
    this.menuContainer    = page.locator('.bm-menu-wrap');
  }

  async openMenu(): Promise<void> {
    await this.click(this.burgerMenuButton, 'burger-menu-open');
  }

  async closeMenu(): Promise<void> {
    await this.click(this.closeMenuButton, 'burger-menu-close');
  }

  async clickAllItems(): Promise<void> {
    await this.click(this.allItemsLink, 'nav-all-items');
  }

  async clickLogout(): Promise<void> {
    await this.click(this.logoutLink, 'nav-logout');
  }

  async clickReset(): Promise<void> {
    await this.click(this.resetLink, 'nav-reset-app-state');
  }
}
