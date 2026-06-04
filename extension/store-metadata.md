# Testing Companion Chrome Web Store Metadata

Use this content as the baseline Chrome Web Store listing for the Testing Companion extension.

## Extension Name

Testing Companion

## Short Description

Manual testing controller for Playwright Enterprise evidence capture and reports.

## Detailed Description

Testing Companion helps QA testers, operations teams, and non-developers run guided manual testing sessions with Playwright Enterprise.

The extension acts as a lightweight controller for a local Playwright Agent running on the tester's machine. Testers can start a manual session, pause or resume the flow, capture screenshots, add notes, mark bugs, toggle cursor visibility, and stop the session to generate a local report bundle.

Key capabilities:

- Start, pause, resume, and stop manual testing sessions.
- Capture screenshots and DOM snapshots through the local Playwright Agent.
- Add tester notes, checkpoints, and bug markers.
- Show a clear 3-second guided testing flow: Initialize, Record, Capture, Stop.
- Toggle cursor visibility during manual testing.
- Display the active local workspace path.
- Generate local report artifacts including `summary.html`, screenshots, DOM snapshots, logs, trace, video, and ZIP bundle.

Testing Companion is designed for internal QA workflows. It does not upload test artifacts to a cloud service. Evidence files are written locally by the Playwright Agent to the configured project workspace.

## Category

Developer Tools

## Language

English

## Target Users

- QA testers
- Operations staff
- Support teams
- Product reviewers
- Non-developers who need repeatable manual testing evidence
- Developers reviewing manual test reports

## Key Benefits

- Makes Playwright evidence capture approachable for non-developers.
- Keeps persistent controls outside the tested page viewport.
- Produces shareable local report bundles.
- Supports deliberate 3-second tutorial pacing for training and demos.
- Works with environments reachable from the Playwright-managed browser.

## Permission Justification

### `activeTab`

Used to send cursor visibility updates to the active browser tab during a manual testing session.

### `tabs`

Used to identify the active tab so the extension can coordinate cursor overlay behavior with the page under test.

### `storage`

Used to remember local extension preferences such as the Playwright Agent WebSocket URL and cursor visibility.

### Host Permission: `<all_urls>`

Required because manual testing may target any local, staging, QA, or production-like environment reachable by the tester's browser. The content script only manages the optional cursor overlay and does not transmit page content to external servers.

## Data Handling Summary

- The extension connects only to the local Playwright Agent URL configured in the popup, usually `ws://127.0.0.1:3737`.
- The extension does not send data to third-party services.
- Report files are generated locally by the Playwright Agent.
- Screenshots, DOM snapshots, logs, trace, and videos remain on the tester's machine unless the tester shares them manually.

## Support Information

For setup and troubleshooting, see the repository README:

https://github.com/Kidpech-code/playwright-enterprise

