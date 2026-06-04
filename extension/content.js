(() => {
  const OVERLAY_ID = '__testing-companion-extension-cursor';
  const STORAGE_KEY = 'testingCompanionCursorVisible';

  let cursorVisible = true;

  function getRoot() {
    return document.documentElement || document.body;
  }

  function ensureCursor() {
    const root = getRoot();
    if (!root) {
      return null;
    }

    let cursor = document.getElementById(OVERLAY_ID);
    if (!cursor) {
      cursor = document.createElement('div');
      cursor.id = OVERLAY_ID;
      cursor.setAttribute('aria-hidden', 'true');
      cursor.style.cssText = [
        'position:fixed',
        'left:0',
        'top:0',
        'width:18px',
        'height:18px',
        'pointer-events:none',
        'z-index:2147483647',
        'transform:translate(-100px,-100px)',
        'transition:opacity 120ms ease',
        'opacity:0'
      ].join(';');

      const pointer = document.createElement('div');
      pointer.style.cssText = [
        'width:0',
        'height:0',
        'border-left:12px solid #111827',
        'border-top:8px solid transparent',
        'border-bottom:8px solid transparent',
        'filter:drop-shadow(0 1px 2px rgba(0,0,0,.35))',
        'transform:rotate(-35deg)'
      ].join(';');
      cursor.appendChild(pointer);
      root.appendChild(cursor);
    }

    return cursor;
  }

  function applyCursorVisibility(visible) {
    cursorVisible = Boolean(visible);
    const cursor = ensureCursor();
    if (!cursor) {
      return;
    }
    cursor.style.opacity = cursorVisible ? '1' : '0';
    if (document.documentElement) {
      document.documentElement.style.cursor = cursorVisible ? 'none' : '';
    }
    if (document.body) {
      document.body.style.cursor = cursorVisible ? 'none' : '';
    }
  }

  function loadCursorState() {
    chrome.storage.local.get([STORAGE_KEY], (result) => {
      applyCursorVisibility(result[STORAGE_KEY] !== false);
    });
  }

  window.addEventListener('mousemove', (event) => {
    const cursor = ensureCursor();
    if (!cursor) {
      return;
    }
    cursor.style.transform = `translate(${event.clientX}px, ${event.clientY}px)`;
    cursor.style.opacity = cursorVisible ? '1' : '0';
  }, true);

  window.addEventListener('__testing_companion_cursor', (event) => {
    applyCursorVisibility(Boolean(event.detail && event.detail.visible));
  });

  chrome.runtime.onMessage.addListener((message) => {
    if (!message || message.type !== 'cursor:set') {
      return;
    }

    applyCursorVisibility(Boolean(message.visible));
  });

  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== 'local' || !changes[STORAGE_KEY]) {
      return;
    }
    applyCursorVisibility(changes[STORAGE_KEY].newValue !== false);
  });

  loadCursorState();
  document.addEventListener('DOMContentLoaded', loadCursorState, { once: true });
})();
