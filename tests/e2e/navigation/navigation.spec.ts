import { test, expect } from '../../../src/fixtures';
import users from '../../../test-data/users.json';

test.describe('Navigation & Burger Menu', () => {
  test.beforeEach(async ({ loginPage }) => {
    await loginPage.open();
    await loginPage.loginAs(users.standardUser.username, process.env.USER_STANDARD_PASSWORD ?? '');
  });

  test('TC-031 | Burger menu should open and display all navigation links', async ({ navigationPage, page }) => {
    await navigationPage.openMenu();
    await expect(page.locator('#inventory_sidebar_link')).toBeVisible();
    await expect(page.locator('#about_sidebar_link')).toBeVisible();
    await expect(page.locator('#logout_sidebar_link')).toBeVisible();
    await expect(page.locator('#reset_sidebar_link')).toBeVisible();
  });

  test('TC-032 | All Items link should navigate back to the product catalog from a detail page', async ({
    catalogPage, navigationPage, page,
  }) => {
    await catalogPage.clickProductNameByIndex(0);
    await expect(page).toHaveURL(/inventory-item/);
    await navigationPage.openMenu();
    await navigationPage.clickAllItems();
    await expect(page.locator('.title')).toHaveText('Products');
  });

  test('TC-033 | Reset App State should clear all items from the cart badge', async ({
    catalogPage, navigationPage, page,
  }) => {
    await catalogPage.addToCartByIndex(0);
    await catalogPage.addToCartByIndex(1);
    await expect(page.locator('.shopping_cart_badge')).toBeVisible();

    await navigationPage.openMenu();
    await navigationPage.clickReset();
    await navigationPage.closeMenu();

    await expect(page.locator('.shopping_cart_badge')).not.toBeVisible();
  });

  test('TC-034 | Logout should redirect the user to the login page', async ({ navigationPage, page }) => {
    await navigationPage.openMenu();
    await navigationPage.clickLogout();
    await expect(page.locator('[data-test="login-button"]')).toBeVisible();
    await expect(page).toHaveURL(/\/$/);
  });
});
