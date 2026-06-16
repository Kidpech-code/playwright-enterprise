# Testing Companion Release Checklist

Use this checklist before publishing or distributing the Chrome Extension.

## Required Assets

- [x] `icons/icon-16.png`
- [x] `icons/icon-32.png`
- [x] `icons/icon-48.png`
- [x] `icons/icon-128.png`
- [x] `manifest.json` includes `icons` and `action.default_icon`
- [x] Store metadata draft
- [x] Privacy policy draft

## Manual Validation

- [x] Run the local Agent (guided tutorial path executed and completed):

  ```bash
  npm run tutorial:start -- --url https://www.saucedemo.com --step-delay 1 --capture-delay 1
  ```

- [x] Confirm `summary.html` opens.
- [x] Confirm `video/video.webm`, `screenshots/`, `snapshots/`, `log.json`, and ZIP are generated.
- [x] Run validation suites:

  ```bash
  npm run manual:validate
  npm run tutorial:validate
  ```

- [ ] Open the Testing Companion popup in the launched browser.
- [ ] Confirm connection to `ws://127.0.0.1:3737`.
- [ ] Click **Start Manual Test**.
- [ ] Capture a screenshot.
- [ ] Add a note.
- [ ] Mark a bug.
- [ ] Toggle cursor visibility.
- [ ] Click **Stop & Generate Report**.

### Last Verified Artifact Bundle

- Session folder: `test-artifacts/session_2026-06-04T15-25-12-488Z/`
- Report: `test-artifacts/session_2026-06-04T15-25-12-488Z/summary.html`
- Zip: `test-artifacts/session_2026-06-04T15-25-12-488Z/session_2026-06-04T15-25-12-488Z.zip`

## Packaging

To create a ZIP for manual distribution:

```bash
cd extension
zip -r ../testing-companion-extension.zip . -x "*.DS_Store"
```

Chrome Web Store uploads should include only the extension directory contents, not generated test artifacts.

- [x] Packaged release zip: `release/testing-companion-0.1.0.zip`
