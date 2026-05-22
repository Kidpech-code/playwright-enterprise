# Playwright Enterprise Framework

> Enterprise-grade E2E test automation framework built with **Playwright** and **TypeScript**, targeting [Sauce Demo](https://www.saucedemo.com/) — a comprehensive learning resource for modern test automation best practices.

---

## Tech Stack

| Tool                                          | Version | Purpose                         |
| --------------------------------------------- | ------- | ------------------------------- |
| [Playwright](https://playwright.dev/)         | ^1.60   | E2E Testing Framework           |
| [TypeScript](https://www.typescriptlang.org/) | ^6.0    | Type-safe scripting             |
| [dotenv](https://github.com/motdotla/dotenv)  | ^17     | Environment variable management |

---

## Project Structure

```
playwright-enterprise/
├── env/
│   ├── .env.staging              # Staging environment variables
│   └── .env.example              # Template for new environments
├── src/
│   ├── fixtures/
│   │   └── index.ts              # Custom Playwright fixture extensions (DI for page objects)
│   ├── helpers/
│   │   └── screenshot.helper.ts  # Auto step-screenshot utility
│   └── pages/                    # Page Object Model (POM)
│       ├── auth/LoginPage.ts
│       ├── base/BasePage.ts      # Abstract base: navigate, click, fill, selectOption
│       ├── cart/CartPage.ts
│       ├── catalog/CatalogPage.ts
│       ├── checkout/
│       │   ├── CheckoutPage.ts
│       │   ├── CheckoutOverviewPage.ts
│       │   └── CheckoutCompletePage.ts
│       ├── navigation/NavigationPage.ts
│       └── product/ProductDetailPage.ts
├── test-data/
│   ├── users.json                # Test user accounts
│   └── checkout.json             # Checkout form data
└── tests/
    └── e2e/
        ├── smoke/login.spec.ts
        ├── catalog/catalog.spec.ts
        ├── product/product.spec.ts
        ├── cart/cart.spec.ts
        ├── checkout/checkout.spec.ts
        └── navigation/navigation.spec.ts
```

---

## Test Scenarios (34 Total)

| Suite           | File                            | TC IDs          | Count |
| --------------- | ------------------------------- | --------------- | ----- |
| Authentication  | `smoke/login.spec.ts`           | TC-001 – TC-006 | 6     |
| Product Catalog | `catalog/catalog.spec.ts`       | TC-007 – TC-012 | 6     |
| Product Detail  | `product/product.spec.ts`       | TC-013 – TC-017 | 5     |
| Shopping Cart   | `cart/cart.spec.ts`             | TC-018 – TC-023 | 6     |
| Checkout Flow   | `checkout/checkout.spec.ts`     | TC-024 – TC-030 | 7     |
| Navigation      | `navigation/navigation.spec.ts` | TC-031 – TC-034 | 4     |

<details>
<summary>View all 34 test cases</summary>

### Authentication

- **TC-001** Valid credentials should authenticate user and display product catalog
- **TC-002** Locked-out user should see an error message
- **TC-003** Wrong password should display an error message
- **TC-004** Empty username should display a validation error
- **TC-005** Empty password should display a validation error
- **TC-006** Logged-in user should be able to logout successfully

### Product Catalog

- **TC-007** Product catalog should display all 6 available products
- **TC-008** Sort by Name (A to Z) should list products in ascending alphabetical order
- **TC-009** Sort by Name (Z to A) should list products in descending alphabetical order
- **TC-010** Sort by Price (low to high) should list products from cheapest to most expensive
- **TC-011** Sort by Price (high to low) should list products from most expensive to cheapest
- **TC-012** Each product card should display name, description, price, and image

### Product Detail

- **TC-013** Clicking a product name should navigate to the product detail page
- **TC-014** Product detail page should display name, description, and price
- **TC-015** Adding a product to cart from detail page should increment the cart badge to 1
- **TC-016** Back to Products button should return user to the product catalog
- **TC-017** Clicking a product image should navigate to the product detail page

### Shopping Cart

- **TC-018** Adding one product should show cart badge count of 1
- **TC-019** Adding three products should show cart badge count of 3
- **TC-020** Removing a product from catalog should decrement the cart badge
- **TC-021** Cart page should display the correct product name that was added
- **TC-022** Removing an item from cart page should decrease the cart item count
- **TC-023** Continue Shopping button should navigate back to the product catalog

### Checkout Flow

- **TC-024** Complete checkout flow should show order confirmation
- **TC-025** Empty first name should display a validation error on checkout
- **TC-026** Empty last name should display a validation error on checkout
- **TC-027** Empty zip code should display a validation error on checkout
- **TC-028** Checkout overview should show 1 item and a positive subtotal
- **TC-029** Cancel on checkout overview should navigate user back to the product catalog
- **TC-030** Order confirmation page should display a success header and thank-you message

### Navigation & Burger Menu

- **TC-031** Burger menu should open and display all navigation links
- **TC-032** All Items link should navigate back to the product catalog from a detail page
- **TC-033** Reset App State should clear all items from the cart badge
- **TC-034** Logout should redirect the user to the login page

</details>

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Installation

```bash
cd playwright-enterprise
npm install
npx playwright install chromium
```

### Environment Setup

Copy `.env.example` and fill in credentials:

```bash
cp env/.env.example env/.env.staging
```

`.env.staging` format:

```
BASE_URL=https://www.saucedemo.com
USER_STANDARD_PASSWORD=secret_sauce
```

---

## Running Tests

```bash
# Run all tests
npm test

# Run by suite
npm run test:auth
npm run test:catalog
npm run test:product
npm run test:cart
npm run test:checkout
npm run test:navigation

# Run all E2E tests
npm run test:e2e

# Run in headed (visible browser) mode
npm run test:headed

# Run in CI mode (fail on .only, max retries)
npm run test:ci

# เฉพาะ chromium
npx playwright test --project=chromium

# เฉพาะ safari
npx playwright test --project=webkit

# Open HTML report
npm run report
```

---

## Key Concepts Demonstrated

### Page Object Model (POM)

Each page has its own class with typed `Locator` properties and action methods. Test files never contain raw locator strings.

### Custom Fixtures

`src/fixtures/index.ts` extends Playwright's base `test` with pre-built page object instances. Tests declare what they need as function parameters — Playwright handles instantiation.

```typescript
test('example', async ({ loginPage, cartPage }) => { ... });
```

### BasePage Abstraction

All page objects extend `BasePage`, which wraps every user action inside `test.step()` and automatically captures a screenshot after each step.

### Data-Driven Testing

Test data is fully separated from test logic in JSON files (`users.json`, `checkout.json`). Sensitive values (passwords) are loaded from environment variables only.

### Parallel Execution

`fullyParallel: true` in `playwright.config.ts` runs tests concurrently across workers for fast feedback, especially in CI.

### Always-On Trace & Video

Every test run records a full browser trace and video. On failure, open the HTML report and click the trace to replay actions step-by-step.

---

## License

MIT
