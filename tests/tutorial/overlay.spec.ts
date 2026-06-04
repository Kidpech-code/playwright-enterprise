import { test, expect } from '@playwright/test';
import {
  TUTORIAL_HIGHLIGHT_ID,
  TUTORIAL_OVERLAY_ID,
} from '../../src/tutorial/overlay';

test('tutorial overlay ids are explicit transient capture targets', () => {
  expect(TUTORIAL_OVERLAY_ID).toContain('tutorial');
  expect(TUTORIAL_HIGHLIGHT_ID).toContain('tutorial');
  expect(TUTORIAL_OVERLAY_ID).not.toBe(TUTORIAL_HIGHLIGHT_ID);
});
