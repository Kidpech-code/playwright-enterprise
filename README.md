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

## Getting Started (Beginner Guide - Thai)

ส่วนนี้เขียนสำหรับคนที่ "ไม่เคยเขียนเทสอัตโนมัติ" มาก่อนเลย

### 1) Playwright คืออะไร?

- Playwright คือเครื่องมือสำหรับสั่ง Browser อัตโนมัติ เหมือนมีคนคลิก/พิมพ์ให้
- เราใช้มันตรวจสอบว่าเว็บทำงานถูกต้อง เช่น ล็อกอินได้, เพิ่มสินค้าเข้าตะกร้าได้, จ่ายเงินได้
- ถ้าอนาคตมีคนแก้โค้ดแล้วระบบพัง เทสจะช่วยเตือนเร็วมาก

### 2) โครงของเทส 1 เคส มีอะไรบ้าง?

ตัวอย่างง่ายที่สุด:

```ts
import { test, expect } from "@playwright/test";

test("user can open homepage", async ({ page }) => {
  await page.goto("https://example.com");
  await expect(page).toHaveTitle(/Example/);
});
```

ความหมายแต่ละส่วน:

- `test(...)` = 1 กรณีทดสอบ
- `page` = แท็บเบราว์เซอร์ที่ใช้คลิก/พิมพ์
- `await` = รอให้คำสั่งทำเสร็จก่อนค่อยไปบรรทัดถัดไป
- `expect(...)` = เงื่อนไขที่ต้องเป็นจริง (Assertion)

### 3) โปรเจกต์นี้ต่างจากเทส Playwright ธรรมดายังไง?

โปรเจกต์นี้ใช้แนวทางที่เป็นระบบสำหรับงานจริง:

- **Page Object Model (POM)**: แยกคำสั่งของแต่ละหน้าไว้ใน `src/pages/`
- **Fixtures**: เตรียม object ของแต่ละหน้าให้พร้อมใช้จาก `src/fixtures/index.ts`
- **Test Data**: ข้อมูลทดสอบอยู่ที่ `test-data/*.json`
- **Environment Variables**: ค่าอย่าง password อยู่ในไฟล์ `env/.env.*`

ข้อดีคือเทสอ่านง่าย, แก้ไขง่าย, และลดการเขียนซ้ำ

### 4) เริ่มใช้งานครั้งแรก (ทำตามทีละข้อ)

### Prerequisites

- Node.js 18+
- npm

### Installation

```bash
cd playwright-enterprise
npm install
npx playwright install chromium
```

### 5) ตั้งค่า Environment

คัดลอกไฟล์ตัวอย่างก่อน:

```bash
cp env/.env.example env/.env.staging
```

แล้วเปิด `env/.env.staging` และใส่ค่าให้ครบ:

```dotenv
BASE_URL=https://www.saucedemo.com
USER_STANDARD_PASSWORD=secret_sauce
```

คำอธิบาย:

- `BASE_URL` คือ URL หลักที่เทสจะเข้า
- `USER_STANDARD_PASSWORD` คือรหัสผ่านผู้ใช้ทดสอบ
- ถ้าอยากสลับ env สามารถใช้ตัวแปร `TEST_ENV` เช่น `TEST_ENV=staging`

ตัวอย่างรันด้วย env ที่ต้องการ:

```bash
# macOS/Linux
TEST_ENV=staging npm test

# Windows (PowerShell)
$env:TEST_ENV='staging'; npm test
```

### 6) รันเทสครั้งแรก

เริ่มจากรันทั้งหมด:

```bash
npm test
```

ถ้าอยากเห็นเบราว์เซอร์ตอนรัน:

```bash
npm run test:headed
```

ถ้าอยากเริ่มจากชุดเล็กก่อน (แนะนำมือใหม่):

```bash
npm run test:auth
```

### 7) ดูผลทดสอบ (Report)

หลังรันเสร็จ เปิดรายงาน:

```bash
npm run report
```

สิ่งที่ควรดูในรายงาน:

- Test ไหนผ่าน/ไม่ผ่าน
- Error message ตอน fail
- Trace/Video ของเคสที่ fail เพื่อไล่ step ย้อนหลัง

### 8) เขียนเทสใหม่อย่างไร (ในโปรเจกต์นี้)

โครงแนะนำสำหรับมือใหม่:

1. สร้างไฟล์ใหม่ใน `tests/e2e/...` เช่น `tests/e2e/smoke/first-login.spec.ts`
2. import `test, expect` จาก `src/fixtures`
3. เรียกใช้ page object เช่น `loginPage`
4. assert ผลลัพธ์ด้วย `expect`

ตัวอย่าง:

```ts
import { test, expect } from "../../../src/fixtures";
import users from "../../../test-data/users.json";

test("BEGINNER-001 | login success should show Products title", async ({
  loginPage,
  page,
}) => {
  await loginPage.open();
  await loginPage.loginAs(
    users.standardUser.username,
    process.env.USER_STANDARD_PASSWORD ?? "",
  );

  await expect(page.locator(".title")).toHaveText("Products");
});
```

รันเฉพาะไฟล์นี้:

```bash
npx playwright test tests/e2e/smoke/first-login.spec.ts --project=chromium --headed
```

### 9) คำศัพท์สำคัญที่ควรรู้

- **Spec file**: ไฟล์เทส เช่น `*.spec.ts`
- **Suite**: กลุ่มเทสที่อยู่ใน `test.describe(...)`
- **Locator**: วิธีเลือก element บนหน้าเว็บ
- **Assertion**: การยืนยันผลด้วย `expect`
- **Fixture**: ของที่ Playwright สร้างให้พร้อมใช้ก่อนเทสเริ่ม
- **POM**: คลาสที่รวมการกระทำของแต่ละหน้า

### 10) Troubleshooting เบื้องต้น

- Error เรื่อง env/password: ตรวจไฟล์ `env/.env.staging`
- Error หา element ไม่เจอ: ลองรัน `npm run test:headed` เพื่อดูหน้าจริง
- เทสผ่านบ้าง fail บ้าง: เปิด trace จาก report เพื่อตรวจ timing และ locator
- อยากดูละเอียดตอน debug: รันเฉพาะไฟล์เดียวก่อน แล้วค่อยขยายไปทั้ง suite

### 11) ลำดับการเรียนที่แนะนำสำหรับมือใหม่

1. รัน `npm run test:auth` ให้ผ่านก่อน
2. อ่านไฟล์ `tests/e2e/smoke/login.spec.ts` เพื่อเข้าใจ pattern
3. ลองเพิ่ม 1 เคสใหม่ในไฟล์เดิม
4. ค่อยขยับไป suite อื่น (`catalog`, `cart`, `checkout`)
5. ปิดท้ายด้วยรัน `npm test` ทั้งระบบ

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

## Manual Testing Companion

The Manual Testing Companion adds a non-developer workflow on top of this Playwright framework. It launches a Playwright-managed Chrome/Chromium window with the local Chrome Extension loaded, records video, captures screenshots and DOM snapshots, collects console/network evidence, and generates a local professional report bundle.

The local Agent is the only process that writes files. The Chrome Extension is the controller: it connects to the Agent over WebSocket, shows the recording state, and sends user actions such as start, screenshot, bug marker, pause, and stop.

### Evidence Documentation Matrix

This table is the quick source of truth for the three manual-testing evidence features reviewers usually ask about first:

| Feature | Current Status | Integration Plan |
| --- | --- | --- |
| Screenshots | Implemented and documented here. Previously not consolidated in one table. | Auto-captured on manual events such as Screenshot, Checkpoint, Note, Bug, session start, and session stop. Saved to `test-artifacts/session_<timestamp>/screenshots/`, with the latest image copied to `test-artifacts/session_<timestamp>/screenshot.png`. |
| Video Recording | Implemented and documented here. Previously not consolidated in one table. | Started by the Playwright-managed browser session and controlled through the WebSocket Agent lifecycle. Finalized on Stop and saved to `test-artifacts/session_<timestamp>/video/video.webm`, with the raw Playwright page video retained in the same `video/` folder. |
| User Guide | Implemented and documented here. Previously not consolidated in one table. | README includes a step-by-step visual walkthrough using 3-second intervals, controller states, artifact layout, report review, and troubleshooting guidance. |

### Start a Manual Session

```bash
npm run manual:start -- --url https://www.saucedemo.com
```

Optional flags:

```bash
# Custom agent port
npm run manual:start -- --port 3737

# Use a proxy for environments only reachable through a proxy
npm run manual:start -- --proxy http://127.0.0.1:8080

# Use a named installed browser channel when needed
npm run manual:start -- --browser-channel chrome
```

Environment variables can also be set in `env/.env.staging`:

```dotenv
MANUAL_TARGET_URL=https://www.saucedemo.com
MANUAL_AGENT_PORT=3737
MANUAL_REPORT_ROOT=test-artifacts
MANUAL_PROFILE_DIR=test-artifacts/manual-profile
MANUAL_EXTENSION_DIR=extension
MANUAL_PROXY=
MANUAL_BROWSER_CHANNEL=
```

### Three-Second Controller Flow

The controller uses a deliberate tutorial cadence for manual actions. Start, capture, and stop commands show the next phase for about 3 seconds before sending the command to the Agent. Pause and Resume stay immediate so a tester can interrupt safely.

1. **Initialization**

   The tester clicks **Start Manual Test** in the Testing Companion popup. The controller highlights **Initialize**, confirms the WebSocket connection to `ws://127.0.0.1:3737`, and shows the workspace path.

   The Agent has already created the session workspace when the managed browser launched:

   ```text
   ./test-artifacts/session_<timestamp>/
   ```

2. **Recording Phase**

   Playwright video recording starts when the managed browser context opens. The controller highlights **Record** and shows the `Recording` state badge. Keep controls in the extension popup for clean video. In-page tutorial indicators are marked with `testing-companion-no-capture` and are hidden before screenshots and DOM snapshots.

3. **Auto-Capture Event**

   The tester clicks **Screenshot**, **Checkpoint**, **Add Note**, or **Mark Bug**. The controller highlights **Capture** for 3 seconds, then the Agent captures the current page screenshot and DOM snapshot together. A `Captured screenshot and DOM snapshot` toast remains visible in the controller for 3 seconds.

4. **Conclusion**

   The tester clicks **Stop & Generate Report**. The controller highlights **Stop** for 3 seconds, then the Agent stops tracing/video, closes the test page, collects artifacts, writes the report files, and builds the ZIP bundle.

Raw Playwright video records the browser viewport exactly. For a clean recording, keep persistent controls in the extension popup. Temporary tutorial hints are safe for screenshots because the Agent hides `.testing-companion-no-capture` and `data-testing-companion-transient` elements before evidence capture.

### Tester Workflow

1. Run `npm run manual:start -- --url <target-url>`.
2. Open the **Testing Companion** extension popup in the launched browser.
3. Confirm the popup is connected to the local Agent.
4. Click **Start Manual Test** to add the visible start marker.
5. Perform the manual test steps in the browser.
6. Use **Screenshot**, **Checkpoint**, **Add Note**, and **Mark Bug** to capture evidence.
7. Use **Hide/Show Cursor** when you want the pointer shown or hidden during the run.
8. Use **Pause / Resume** for non-destructive debugging. The browser, trace, video, and session context stay alive.
9. Click **Stop & Generate Report**.
10. Open the local `file://` report link printed by the CLI or shown in the extension popup.

### Artifact Layout

Manual and guided tutorial reports are written under `test-artifacts` by default:

```text
test-artifacts/session_<timestamp>/
|-- summary.html
|-- index.html
|-- manual-session.json
|-- log.json
|-- logs.json
|-- screenshot.png
|-- trace.zip
|-- video/
|   |-- video.webm
|   |-- page@<id>.webm
|-- screenshots/
|   |-- step-0001-*.png
|   |-- step-0002-*.png
|-- snapshots/
|   |-- step-0001-*.html
|   |-- step-0002-*.html
|-- session_<timestamp>.zip
```

`summary.html` is the primary report. `index.html` is kept as a compatibility copy so local links remain easy to open.

### How Evidence Appears In The Report

- **Summary metrics** show status, duration, step count, bugs, console logs, and network issues.
- **Artifacts** link to `manual-session.json`, `log.json`, `trace.zip`, `screenshot.png`, `video/video.webm`, and the ZIP bundle.
- **Video Recordings** render inline with native `<video controls>`, so reviewers can watch the captured viewport directly from `summary.html`.
- **Timeline** shows each manual or tutorial step with the screenshot thumbnail, URL, page title, viewport, notes, severity/category, and direct links to the DOM snapshot and screenshot.
- **Logs** show console entries and network failures in a readable JSON panel.

### Troubleshooting Manual Sessions

- **Extension cannot connect to the Agent**

  Start the Agent first with `npm run manual:start -- --url <target-url>`. Confirm the popup Agent field matches the CLI port, usually `ws://127.0.0.1:3737`.

- **Permission denied while creating files**

  The Agent writes to `MANUAL_REPORT_ROOT` or `TUTORIAL_REPORT_ROOT`. Use a writable folder such as `test-artifacts`, avoid protected system folders, and create the directory manually if needed:

  ```bash
  mkdir -p test-artifacts
  ```

- **No video appears**

  Stop the session from the controller or press `Ctrl+C` in the CLI so Playwright can close the page and flush `.webm` files. Video files are finalized only when the browser page/context closes.

- **Controller UI appears in evidence**

  Keep primary controls in the extension popup. In-page tutorial cues are transient and hidden before screenshots/DOM snapshots, but raw video records whatever is visible inside the page viewport.

### Validation

```bash
npm run manual:validate
```

This checks that the manual report generator writes the expected HTML, JSON, logs, and ZIP artifacts.

---

## Guided Tutorial Recorder

The Guided Tutorial Recorder is a polished autoplay walkthrough for teaching the existing Sauce Demo flow. It reuses the Page Object Model classes in `src/pages`, moves at a deliberate 3-second pace, hides tutorial indicators before screenshots, and uses the Testing Companion extension as the recording control surface.

### Start the Guided Tutorial

```bash
npm run tutorial:start -- --url https://www.saucedemo.com
```

Open the **Testing Companion** extension popup in the launched browser to control the session. The controller stays outside the captured page viewport, so its buttons do not appear in screenshots or videos.

Available controls:

- **Start Recording** adds a start marker.
- **Pause / Resume** pauses tutorial progression without destroying the browser, trace, video, or session context.
- **Step Forward** skips the current tutorial delay.
- **Screenshot**, **Add Note**, **Checkpoint**, and **Mark Bug** add evidence to the report.
- **Stop & Generate Report** finalizes the video, trace, screenshots, DOM snapshots, logs, HTML report, and ZIP bundle.

The controller status badge shows the current recording state: idle, preparing, recording, paused, capturing, stopping, report ready, or error.

### Tutorial Flow

The default tutorial records this journey:

1. Open the Sauce Demo login page.
2. Log in with the standard user.
3. Review and sort the product catalog.
4. Open a product detail page.
5. Add the product to the cart.
6. Review the cart.
7. Enter checkout information.
8. Review the checkout overview.
9. Finish checkout and capture the order confirmation page.

### Timing And Debug Options

The default training pace is 3 seconds before each action and 3 seconds around each capture:

```bash
npm run tutorial:start -- --step-delay 3000 --capture-delay 3000
```

Use shorter delays for smoke validation:

```bash
npm run tutorial:start -- --step-delay 1 --capture-delay 1
```

Environment variables can also be set in `env/.env.staging`:

```dotenv
TUTORIAL_TARGET_URL=https://www.saucedemo.com
TUTORIAL_REPORT_ROOT=test-artifacts
TUTORIAL_PROFILE_DIR=test-artifacts/tutorial-profile
TUTORIAL_MODE=autoplay
TUTORIAL_STEP_DELAY_MS=3000
TUTORIAL_CAPTURE_DELAY_MS=3000
TUTORIAL_PAUSE_ON_FAILURE=false
```

When `TUTORIAL_PAUSE_ON_FAILURE=true`, failures pause the tutorial for live code review before the report is finalized.

### Validation

```bash
npm run tutorial:validate
```

This validates tutorial step sequencing and confirms transient overlays are hidden before evidence capture.

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
