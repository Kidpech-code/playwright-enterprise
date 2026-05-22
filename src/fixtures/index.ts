import { test as base } from '@playwright/test';
import { LoginPage } from '../pages/auth/LoginPage';
import { CatalogPage } from '../pages/catalog/CatalogPage';
import { ProductDetailPage } from '../pages/product/ProductDetailPage';
import { CartPage } from '../pages/cart/CartPage';
import { CheckoutPage } from '../pages/checkout/CheckoutPage';
import { CheckoutOverviewPage } from '../pages/checkout/CheckoutOverviewPage';
import { CheckoutCompletePage } from '../pages/checkout/CheckoutCompletePage';
import { NavigationPage } from '../pages/navigation/NavigationPage';

type Pages = {
  loginPage: LoginPage;
  catalogPage: CatalogPage;
  productDetailPage: ProductDetailPage;
  cartPage: CartPage;
  checkoutPage: CheckoutPage;
  checkoutOverviewPage: CheckoutOverviewPage;
  checkoutCompletePage: CheckoutCompletePage;
  navigationPage: NavigationPage;
};

export const test = base.extend<Pages>({
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },
  catalogPage: async ({ page }, use) => {
    await use(new CatalogPage(page));
  },
  productDetailPage: async ({ page }, use) => {
    await use(new ProductDetailPage(page));
  },
  cartPage: async ({ page }, use) => {
    await use(new CartPage(page));
  },
  checkoutPage: async ({ page }, use) => {
    await use(new CheckoutPage(page));
  },
  checkoutOverviewPage: async ({ page }, use) => {
    await use(new CheckoutOverviewPage(page));
  },
  checkoutCompletePage: async ({ page }, use) => {
    await use(new CheckoutCompletePage(page));
  },
  navigationPage: async ({ page }, use) => {
    await use(new NavigationPage(page));
  },
});

export { expect } from '@playwright/test';
