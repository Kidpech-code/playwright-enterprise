import { test, expect } from '../../../src/fixtures';
import users from '../../../test-data/users.json';

test.describe('Shopping Cart', () => {
  test.beforeEach(async ({ loginPage }) => {
    await loginPage.open();
    await loginPage.loginAs(users.standardUser.username, process.env.USER_STANDARD_PASSWORD ?? '');
  });

  test('TC-018 | Adding one product should show cart badge count of 1', async ({ catalogPage }) => {
    await catalogPage.addToCartByIndex(0);
    const count = await catalogPage.getCartBadgeCount();
    expect(count).toBe(1);
  });

  test('TC-019 | Adding three products should show cart badge count of 3', async ({ catalogPage }) => {
    await catalogPage.addToCartByIndex(0);
    await catalogPage.addToCartByIndex(1);
    await catalogPage.addToCartByIndex(2);
    const count = await catalogPage.getCartBadgeCount();
    expect(count).toBe(3);
  });

  test('TC-020 | Removing a product from catalog should decrement the cart badge', async ({ catalogPage }) => {
    await catalogPage.addToCartByIndex(0);
    await catalogPage.addToCartByIndex(1);
    await catalogPage.removeFromCartByIndex(0);
    const count = await catalogPage.getCartBadgeCount();
    expect(count).toBe(1);
  });

  test('TC-021 | Cart page should display the correct product name that was added', async ({ catalogPage, cartPage }) => {
    const names = await catalogPage.getProductNames();
    const firstProductName = names[0];
    await catalogPage.addToCartByIndex(0);
    await catalogPage.clickCartIcon();
    const cartItemNames = await cartPage.getItemNames();
    expect(cartItemNames).toContain(firstProductName);
  });

  test('TC-022 | Removing an item from cart page should decrease the cart item count', async ({ catalogPage, cartPage }) => {
    await catalogPage.addToCartByIndex(0);
    await catalogPage.addToCartByIndex(1);
    await catalogPage.clickCartIcon();
    const initialCount = await cartPage.getItemCount();
    await cartPage.removeItemByIndex(0);
    const finalCount = await cartPage.getItemCount();
    expect(finalCount).toBe(initialCount - 1);
  });

  test('TC-023 | Continue Shopping button should navigate back to the product catalog', async ({ catalogPage, cartPage, page }) => {
    await catalogPage.addToCartByIndex(0);
    await catalogPage.clickCartIcon();
    await cartPage.clickContinueShopping();
    await expect(page.locator('.title')).toHaveText('Products');
  });
});
