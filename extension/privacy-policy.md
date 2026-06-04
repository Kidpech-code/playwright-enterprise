# Testing Companion Privacy Policy

Last updated: June 4, 2026

Testing Companion is a Chrome Extension for controlling local Playwright Enterprise manual testing sessions. This privacy policy explains what data the extension accesses, how that data is used, and where evidence artifacts are stored.

## Summary

Testing Companion is designed for local manual testing workflows. The extension connects to a local Playwright Agent running on the tester's machine and sends user-triggered control commands such as start, pause, screenshot, checkpoint, bug marker, cursor toggle, and stop.

Testing Companion does not sell data, does not use data for advertising, and does not transmit testing artifacts to third-party services.

## Data The Extension May Access

Depending on how a tester uses the tool, the local Playwright Agent may generate:

- Screenshots of the page under test.
- DOM snapshots of the page under test.
- Console logs and network failure summaries.
- Playwright trace files.
- Video recordings of the Playwright-managed browser viewport.
- Tester-entered notes, checkpoints, categories, and severity labels.
- Local report metadata such as target URL, viewport size, timestamps, and artifact paths.

The Chrome Extension itself stores only lightweight local preferences:

- The configured local WebSocket Agent URL, such as `ws://127.0.0.1:3737`.
- Cursor visibility preference.

## How Data Is Used

Data is used only to support manual testing evidence capture and local report generation.

The extension sends commands to the local Playwright Agent through WebSocket. The Agent performs screenshots, DOM snapshot capture, video recording, trace capture, and report generation.

## Where Data Is Stored

Generated testing artifacts are stored locally in the configured project workspace, by default:

```text
test-artifacts/session_<timestamp>/
```

The generated folder can include:

```text
summary.html
manual-session.json
log.json
screenshot.png
trace.zip
video/video.webm
screenshots/
snapshots/
session_<timestamp>.zip
```

The extension does not upload these files. Testers or teams decide if and how to share generated ZIP bundles or reports.

## Data Sharing

Testing Companion does not share data with third parties.

If a tester manually sends a generated report, ZIP bundle, screenshot, DOM snapshot, trace, video, or log to another person or system, that sharing is controlled by the tester or organization.

## Remote Code

Testing Companion does not execute remote code. Extension files are packaged with the extension.

## Network Communication

Testing Companion communicates with the local Playwright Agent using WebSocket. The default URL is:

```text
ws://127.0.0.1:3737
```

The extension content security policy allows WebSocket connections to localhost only:

```text
ws://127.0.0.1:* ws://localhost:*
```

## Permissions

Testing Companion requests:

- `activeTab`: to coordinate cursor visibility with the active page.
- `tabs`: to identify the active tab for cursor overlay updates.
- `storage`: to remember local preferences.
- `<all_urls>` host access: to support manual testing across local, staging, QA, and production-like environments reachable by the tester.

## User Control

Users control when testing sessions start and stop. Users also control when screenshots, checkpoints, notes, and bug markers are captured through the extension popup.

Users can delete generated artifacts at any time by removing the local `test-artifacts/` session folders.

## Contact

For questions about this extension, open an issue or contact the repository owner through:

https://github.com/Kidpech-code/playwright-enterprise

