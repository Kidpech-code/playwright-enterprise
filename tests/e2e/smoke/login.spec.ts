import { test, expect } from '../../../src/fixtures';
import users from '../../../test-data/users.json';

test.describe('Authentication', () => {
  test('TC-001 | Valid credentials should authenticate user and display product catalog', async ({ loginPage, page }) => {
    const username = users.standardUser.username;
    const password = process.env.USER_STANDARD_PASSWORD ?? '';

    await loginPage.open();
    await loginPage.loginAs(username, password);

    await expect(page.locator('.title')).toHaveText('Products');
  });

  test('TC-002 | Locked-out user should see an error message', async ({ loginPage, page }) => {
    await loginPage.open();
    await loginPage.loginAs(users.lockedOutUser.username, process.env.USER_STANDARD_PASSWORD ?? '');

    await expect(page.locator('[data-test="error"]')).toBeVisible();
    await expect(page.locator('[data-test="error"]')).toContainText('Sorry, this user has been locked out');
  });

  test('TC-003 | Wrong password should display an error message', async ({ loginPage, page }) => {
    await loginPage.open();
    await loginPage.loginAs(users.standardUser.username, 'wrong_password');

    await expect(page.locator('[data-test="error"]')).toBeVisible();
    await expect(page.locator('[data-test="error"]')).toContainText('Username and password do not match');
  });

  test('TC-004 | Empty username should display a validation error', async ({ loginPage, page }) => {
    await loginPage.open();
    await loginPage.loginAs('', process.env.USER_STANDARD_PASSWORD ?? '');

    await expect(page.locator('[data-test="error"]')).toContainText('Username is required');
  });

  test('TC-005 | Empty password should display a validation error', async ({ loginPage, page }) => {
    await loginPage.open();
    await loginPage.loginAs(users.standardUser.username, '');

    await expect(page.locator('[data-test="error"]')).toContainText('Password is required');
  });

  test('TC-006 | Logged-in user should be able to logout successfully', async ({ loginPage, page }) => {
    await loginPage.open();
    await loginPage.loginAs(users.standardUser.username, process.env.USER_STANDARD_PASSWORD ?? '');
    await expect(page.locator('.title')).toHaveText('Products');

    await page.locator('#react-burger-menu-btn').click();
    await page.locator('#logout_sidebar_link').click();

    await expect(page.locator('[data-test="login-button"]')).toBeVisible();
  });
});
