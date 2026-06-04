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

- [ ] Run the local Agent:

  ```bash
  npm run manual:start -- --url https://www.saucedemo.com
  ```

- [ ] Open the Testing Companion popup.
- [ ] Confirm connection to `ws://127.0.0.1:3737`.
- [ ] Click **Start Manual Test**.
- [ ] Capture a screenshot.
- [ ] Add a note.
- [ ] Mark a bug.
- [ ] Toggle cursor visibility.
- [ ] Click **Stop & Generate Report**.
- [ ] Confirm `summary.html` opens.
- [ ] Confirm `video/video.webm`, `screenshots/`, `snapshots/`, `log.json`, and ZIP are generated.

## Packaging

To create a ZIP for manual distribution:

```bash
cd extension
zip -r ../testing-companion-extension.zip . -x "*.DS_Store"
```

Chrome Web Store uploads should include only the extension directory contents, not generated test artifacts.

