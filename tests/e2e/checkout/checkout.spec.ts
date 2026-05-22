import { test, expect } from '../../../src/fixtures';
import users from '../../../test-data/users.json';
import checkoutData from '../../../test-data/checkout.json';

test.describe('Checkout Flow', () => {
  test.beforeEach(async ({ loginPage, catalogPage }) => {
    await loginPage.open();
    await loginPage.loginAs(users.standardUser.username, process.env.USER_STANDARD_PASSWORD ?? '');
    await catalogPage.addToCartByIndex(0);
    await catalogPage.clickCartIcon();
  });

  test('TC-024 | Complete checkout flow should show order confirmation', async ({
    cartPage, checkoutPage, checkoutOverviewPage, checkoutCompletePage,
  }) => {
    const { firstName, lastName, zipCode } = checkoutData.validCustomer;
    await cartPage.clickCheckout();
    await checkoutPage.fillCustomerInfo(firstName, lastName, zipCode);
    await checkoutPage.clickContinue();
    await checkoutOverviewPage.clickFinish();
    await expect(checkoutCompletePage.completeHeader).toHaveText('Thank you for your order!');
  });

  test('TC-025 | Empty first name should display a validation error on checkout', async ({
    cartPage, checkoutPage,
  }) => {
    const { lastName, zipCode } = checkoutData.validCustomer;
    await cartPage.clickCheckout();
    await checkoutPage.fillCustomerInfo('', lastName, zipCode);
    await checkoutPage.clickContinue();
    await expect(checkoutPage.errorMessage).toContainText('First Name is required');
  });

  test('TC-026 | Empty last name should display a validation error on checkout', async ({
    cartPage, checkoutPage,
  }) => {
    const { firstName, zipCode } = checkoutData.validCustomer;
    await cartPage.clickCheckout();
    await checkoutPage.fillCustomerInfo(firstName, '', zipCode);
    await checkoutPage.clickContinue();
    await expect(checkoutPage.errorMessage).toContainText('Last Name is required');
  });

  test('TC-027 | Empty zip code should display a validation error on checkout', async ({
    cartPage, checkoutPage,
  }) => {
    const { firstName, lastName } = checkoutData.validCustomer;
    await cartPage.clickCheckout();
    await checkoutPage.fillCustomerInfo(firstName, lastName, '');
    await checkoutPage.clickContinue();
    await expect(checkoutPage.errorMessage).toContainText('Postal Code is required');
  });

  test('TC-028 | Checkout overview should show 1 item and a positive subtotal', async ({
    cartPage, checkoutPage, checkoutOverviewPage,
  }) => {
    const { firstName, lastName, zipCode } = checkoutData.validCustomer;
    await cartPage.clickCheckout();
    await checkoutPage.fillCustomerInfo(firstName, lastName, zipCode);
    await checkoutPage.clickContinue();
    const itemCount = await checkoutOverviewPage.getItemCount();
    const subtotal  = await checkoutOverviewPage.getSubtotal();
    expect(itemCount).toBe(1);
    expect(subtotal).toBeGreaterThan(0);
  });

  test('TC-029 | Cancel on checkout overview should navigate user back to the product catalog', async ({
    page, cartPage, checkoutPage, checkoutOverviewPage,
  }) => {
    const { firstName, lastName, zipCode } = checkoutData.validCustomer;
    await cartPage.clickCheckout();
    await checkoutPage.fillCustomerInfo(firstName, lastName, zipCode);
    await checkoutPage.clickContinue();
    await checkoutOverviewPage.clickCancel();
    await expect(page.locator('.title')).toHaveText('Products');
  });

  test('TC-030 | Order confirmation page should display a success header and thank-you message', async ({
    page, cartPage, checkoutPage, checkoutOverviewPage, checkoutCompletePage,
  }) => {
    const { firstName, lastName, zipCode } = checkoutData.validCustomer;
    await cartPage.clickCheckout();
    await checkoutPage.fillCustomerInfo(firstName, lastName, zipCode);
    await checkoutPage.clickContinue();
    await checkoutOverviewPage.clickFinish();
    await expect(checkoutCompletePage.completeHeader).toBeVisible();
    await expect(checkoutCompletePage.completeText).toBeVisible();
    await expect(page).toHaveURL(/checkout-complete/);
  });
});
