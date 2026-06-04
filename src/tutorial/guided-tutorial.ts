import { ManualReportResult } from '../manual/types';
import { ManualSessionRuntime } from '../manual/session';
import { LoginPage } from '../pages/auth/LoginPage';
import { CatalogPage } from '../pages/catalog/CatalogPage';
import { ProductDetailPage } from '../pages/product/ProductDetailPage';
import { CartPage } from '../pages/cart/CartPage';
import { CheckoutPage } from '../pages/checkout/CheckoutPage';
import { CheckoutOverviewPage } from '../pages/checkout/CheckoutOverviewPage';
import { CheckoutCompletePage } from '../pages/checkout/CheckoutCompletePage';
import { TutorialStepExecutor } from './executor';
import { TutorialOverlayController } from './overlay';
import { GuidedTutorialOptions, TutorialStep } from './types';
import users from '../../test-data/users.json';
import checkout from '../../test-data/checkout.json';

export class GuidedTutorialRunner {
  constructor(
    private readonly runtime: ManualSessionRuntime,
    private readonly options: GuidedTutorialOptions,
  ) {}

  async run(): Promise<ManualReportResult> {
    await this.runtime.start();
    const page = await this.runtime.getActivePage();
    const overlay = new TutorialOverlayController(page);
    const executor = new TutorialStepExecutor(
      this.runtime,
      overlay,
      this.options.timing,
      { page },
    );

    const loginPage = new LoginPage(page);
    const catalogPage = new CatalogPage(page);
    const productDetailPage = new ProductDetailPage(page);
    const cartPage = new CartPage(page);
    const checkoutPage = new CheckoutPage(page);
    const checkoutOverviewPage = new CheckoutOverviewPage(page);
    const checkoutCompletePage = new CheckoutCompletePage(page);

    const steps = this.createSteps({
      loginPage,
      catalogPage,
      productDetailPage,
      cartPage,
      checkoutPage,
      checkoutOverviewPage,
      checkoutCompletePage,
    });

    try {
      for (const step of steps) {
        if (this.runtime.isStopRequested()) {
          return this.runtime.waitForCompletion();
        }
        await executor.runStep(step);
      }

      await overlay.hide();
      return await this.runtime.finish('completed');
    } catch (error) {
      await overlay.hide();
      const message = error instanceof Error ? error.message : String(error);
      await this.runtime.setControllerState('error', { message });
      await this.runtime.recordEvidence('bug', {
        label: 'Guided tutorial failed',
        note: message,
        category: 'guided-tutorial',
        severity: 'high',
      }).catch(() => undefined);

      if (this.runtime.isStopRequested()) {
        return this.runtime.waitForCompletion();
      }

      if (this.options.pauseOnFailure) {
        await this.runtime.pauseForDebug(
          `Tutorial paused for code review after failure: ${message}`,
        );
        return this.runtime.waitForCompletion();
      }

      throw error;
    }
  }

  private createSteps(pages: {
    loginPage: LoginPage;
    catalogPage: CatalogPage;
    productDetailPage: ProductDetailPage;
    cartPage: CartPage;
    checkoutPage: CheckoutPage;
    checkoutOverviewPage: CheckoutOverviewPage;
    checkoutCompletePage: CheckoutCompletePage;
  }): TutorialStep[] {
    const password = process.env.USER_STANDARD_PASSWORD || 'secret_sauce';
    const customer = checkout.validCustomer;

    return [
      {
        id: 'login-open',
        title: 'Open The Login Page',
        description: 'The tutorial begins by opening the Sauce Demo login page and recording the initial state.',
        targetSelector: '[data-test="login-button"]',
        captureLabel: 'Login page ready',
        action: async () => {
          await pages.loginPage.open();
        },
      },
      {
        id: 'login-submit',
        title: 'Sign In As A Standard User',
        description: 'Credentials are entered deliberately so viewers can see each field interaction before the product catalog opens.',
        targetSelector: '[data-test="username"]',
        captureLabel: 'Logged in product catalog',
        action: async () => {
          await pages.loginPage.loginAs(users.standardUser.username, password);
          await pages.catalogPage.pageTitle.waitFor({ state: 'visible' });
        },
      },
      {
        id: 'catalog-review',
        title: 'Review The Product Catalog',
        description: 'The catalog is visible, then sorted so the report captures a meaningful product-list state.',
        targetSelector: '[data-test="product-sort-container"]',
        captureLabel: 'Catalog sorted by price',
        action: async () => {
          await pages.catalogPage.sortBy('lohi');
        },
      },
      {
        id: 'product-detail',
        title: 'Open A Product Detail Page',
        description: 'The tutorial drills into the first product to demonstrate navigation and detail-page evidence capture.',
        targetSelector: '.inventory_item:first-child .inventory_item_name',
        captureLabel: 'Product detail page',
        action: async ({ page }) => {
          await Promise.all([
            page.waitForURL(/inventory-item\.html/),
            pages.catalogPage.clickProductTitleLinkByIndex(0),
          ]);
          await pages.productDetailPage.productName.waitFor({ state: 'visible' });
        },
      },
      {
        id: 'product-add-cart',
        title: 'Add The Product To The Cart',
        description: 'The product is added from the detail page and the cart badge becomes the visible confirmation.',
        targetSelector: '[data-test="add-to-cart"]',
        captureLabel: 'Product added to cart',
        action: async () => {
          await pages.productDetailPage.addToCart();
          await pages.productDetailPage.cartBadge.waitFor({ state: 'visible' });
        },
      },
      {
        id: 'cart-open',
        title: 'Open The Cart',
        description: 'The cart page confirms the chosen product before checkout begins.',
        targetSelector: '.shopping_cart_link',
        captureLabel: 'Cart item reviewed',
        action: async ({ page }) => {
          await page.locator('.shopping_cart_link').click();
          await pages.cartPage.cartItems.first().waitFor({ state: 'visible' });
        },
      },
      {
        id: 'checkout-info',
        title: 'Enter Checkout Information',
        description: 'Customer information is filled slowly so the report captures the editable checkout form before continuing.',
        targetSelector: '[data-test="checkout"]',
        captureLabel: 'Checkout information entered',
        action: async () => {
          await pages.cartPage.clickCheckout();
          await pages.checkoutPage.fillCustomerInfo(
            customer.firstName,
            customer.lastName,
            customer.zipCode,
          );
        },
      },
      {
        id: 'checkout-overview',
        title: 'Review The Checkout Overview',
        description: 'The checkout overview is opened and captured before the order is finalized.',
        targetSelector: '[data-test="continue"]',
        captureLabel: 'Checkout overview ready',
        action: async () => {
          await pages.checkoutPage.clickContinue();
          await pages.checkoutOverviewPage.cartItems.first().waitFor({ state: 'visible' });
        },
      },
      {
        id: 'checkout-complete',
        title: 'Finish Checkout',
        description: 'The order is finalized and the confirmation page is recorded as the closing tutorial evidence.',
        targetSelector: '[data-test="finish"]',
        captureLabel: 'Order confirmation complete',
        action: async () => {
          await pages.checkoutOverviewPage.clickFinish();
          await pages.checkoutCompletePage.completeHeader.waitFor({ state: 'visible' });
        },
      },
    ];
  }
}
