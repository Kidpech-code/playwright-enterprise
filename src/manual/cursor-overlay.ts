export function cursorOverlayInitScript(): string {
  return `
(() => {
  const STATE_KEY = '__testingCompanionCursorVisible';
  const OVERLAY_ID = '__testing-companion-cursor';

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
      cursor.innerHTML = '<div style="width:0;height:0;border-left:12px solid #111827;border-top:8px solid transparent;border-bottom:8px solid transparent;filter:drop-shadow(0 1px 2px rgba(0,0,0,.35));transform:rotate(-35deg);"></div>';
      root.appendChild(cursor);
    }
    return cursor;
  }

  function applyCursorVisibility(visible) {
    window[STATE_KEY] = Boolean(visible);
    const cursor = ensureCursor();
    if (!cursor) {
      return;
    }
    cursor.style.opacity = visible ? '1' : '0';
    if (document.documentElement) {
      document.documentElement.style.cursor = visible ? 'none' : '';
    }
    if (document.body) {
      document.body.style.cursor = visible ? 'none' : '';
    }
  }

  window.addEventListener('mousemove', (event) => {
    const cursor = ensureCursor();
    if (!cursor) {
      return;
    }
    cursor.style.transform = 'translate(' + event.clientX + 'px,' + event.clientY + 'px)';
    cursor.style.opacity = window[STATE_KEY] ? '1' : '0';
  }, true);

  window.addEventListener('__testing_companion_cursor', (event) => {
    applyCursorVisibility(Boolean(event.detail && event.detail.visible));
  });

  applyCursorVisibility(true);
  document.addEventListener('DOMContentLoaded', () => applyCursorVisibility(window[STATE_KEY] !== false), { once: true });
})();
`;
}
