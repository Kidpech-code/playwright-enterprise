import { test, expect } from '../../../src/fixtures';
import users from '../../../test-data/users.json';

test.describe('Product Catalog', () => {
  test.beforeEach(async ({ loginPage }) => {
    await loginPage.open();
    await loginPage.loginAs(users.standardUser.username, process.env.USER_STANDARD_PASSWORD ?? '');
  });

  test('TC-007 | Product catalog should display all 6 available products', async ({ catalogPage }) => {
    const count = await catalogPage.getProductCount();
    expect(count).toBe(6);
  });

  test('TC-008 | Sort by Name (A to Z) should list products in ascending alphabetical order', async ({ catalogPage }) => {
    await catalogPage.sortBy('az');
    const names = await catalogPage.getProductNames();
    expect(names).toEqual([...names].sort());
  });

  test('TC-009 | Sort by Name (Z to A) should list products in descending alphabetical order', async ({ catalogPage }) => {
    await catalogPage.sortBy('za');
    const names = await catalogPage.getProductNames();
    expect(names).toEqual([...names].sort().reverse());
  });

  test('TC-010 | Sort by Price (low to high) should list products from cheapest to most expensive', async ({ catalogPage }) => {
    await catalogPage.sortBy('lohi');
    const prices = await catalogPage.getProductPrices();
    expect(prices).toEqual([...prices].sort((a, b) => a - b));
  });

  test('TC-011 | Sort by Price (high to low) should list products from most expensive to cheapest', async ({ catalogPage }) => {
    await catalogPage.sortBy('hilo');
    const prices = await catalogPage.getProductPrices();
    expect(prices).toEqual([...prices].sort((a, b) => b - a));
  });

  test('TC-012 | Each product card should display name, description, price, and image', async ({ page }) => {
    const firstItem = page.locator('.inventory_item').first();
    await expect(firstItem.locator('.inventory_item_name')).toBeVisible();
    await expect(firstItem.locator('.inventory_item_desc')).toBeVisible();
    await expect(firstItem.locator('.inventory_item_price')).toBeVisible();
    await expect(firstItem.locator('img')).toBeVisible();
  });
});
