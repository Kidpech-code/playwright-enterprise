import { test, expect } from '../../../src/fixtures';
import users from '../../../test-data/users.json';

test.describe('Product Detail', () => {
  test.beforeEach(async ({ loginPage }) => {
    await loginPage.open();
    await loginPage.loginAs(users.standardUser.username, process.env.USER_STANDARD_PASSWORD ?? '');
  });

  test('TC-013 | Clicking a product name should navigate to the product detail page', async ({ catalogPage, page }) => {
    await catalogPage.clickProductNameByIndex(0);
    await expect(page).toHaveURL(/inventory-item/);
  });

  test('TC-014 | Product detail page should display name, description, and price', async ({ catalogPage, productDetailPage }) => {
    await catalogPage.clickProductNameByIndex(0);
    await expect(productDetailPage.productName).toBeVisible();
    await expect(productDetailPage.productDescription).toBeVisible();
    await expect(productDetailPage.productPrice).toBeVisible();
  });

  test('TC-015 | Adding a product to cart from detail page should increment the cart badge to 1', async ({ catalogPage, productDetailPage }) => {
    await catalogPage.clickProductNameByIndex(0);
    await productDetailPage.addToCart();
    const badgeCount = await productDetailPage.getCartBadgeCount();
    expect(badgeCount).toBe(1);
  });

  test('TC-016 | Back to Products button should return user to the product catalog', async ({ catalogPage, productDetailPage, page }) => {
    await catalogPage.clickProductNameByIndex(0);
    await expect(page).toHaveURL(/inventory-item/);
    await productDetailPage.clickBack();
    await expect(page.locator('.title')).toHaveText('Products');
  });

  test('TC-017 | Clicking a product image should navigate to the product detail page', async ({ catalogPage, page }) => {
    await catalogPage.clickProductImageByIndex(0);
    await expect(page).toHaveURL(/inventory-item/);
  });
});
