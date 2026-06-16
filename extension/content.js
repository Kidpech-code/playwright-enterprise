(() => {
  const STORAGE_KEY = 'testingCompanionCursorVisible';

  function dispatchCursorEvent(visible) {
    window.dispatchEvent(new CustomEvent('__testing_companion_cursor', {
      detail: { visible: Boolean(visible) },
    }));
  }

  chrome.runtime.onMessage.addListener((message) => {
    if (!message || message.type !== 'cursor:set') {
      return;
    }
    dispatchCursorEvent(Boolean(message.visible));
  });

  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== 'local' || !changes[STORAGE_KEY]) {
      return;
    }
    dispatchCursorEvent(changes[STORAGE_KEY].newValue !== false);
  });

  chrome.storage.local.get([STORAGE_KEY], (result) => {
    dispatchCursorEvent(result[STORAGE_KEY] !== false);
  });
})();
