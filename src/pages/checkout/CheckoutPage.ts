import { Page, Locator } from '@playwright/test';
import { BasePage } from '../base/BasePage';

export class CheckoutPage extends BasePage {
  private readonly firstNameInput: Locator;
  private readonly lastNameInput: Locator;
  private readonly zipCodeInput: Locator;
  private readonly continueButton: Locator;
  private readonly cancelButton: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    super(page);
    this.firstNameInput = page.locator('[data-test="firstName"]');
    this.lastNameInput  = page.locator('[data-test="lastName"]');
    this.zipCodeInput   = page.locator('[data-test="postalCode"]');
    this.continueButton = page.locator('[data-test="continue"]');
    this.cancelButton   = page.locator('[data-test="cancel"]');
    this.errorMessage   = page.locator('[data-test="error"]');
  }

  async fillCustomerInfo(firstName: string, lastName: string, zipCode: string): Promise<void> {
    await this.fill(this.firstNameInput, firstName, 'first-name');
    await this.fill(this.lastNameInput, lastName, 'last-name');
    await this.fill(this.zipCodeInput, zipCode, 'zip-code');
  }

  async clickContinue(): Promise<void> {
    await this.click(this.continueButton, 'continue');
  }

  async clickCancel(): Promise<void> {
    await this.click(this.cancelButton, 'cancel');
  }
}
