import { beforeEach, expect, test } from 'vitest';
import { clearSessionDraft, SESSION_DRAFT_KEYS } from '../../utils/sessionDraft';
import { safeStorage } from '../../utils/storage';
import { changeScope } from '../../utils/workspace';

beforeEach(() => { localStorage.clear(); changeScope('guest'); });

test('draft cleanup is complete, idempotent and preserves saved records/preferences', () => {
  for (const key of SESSION_DRAFT_KEYS) safeStorage.setItem(key, 'old draft');
  const retained = ['neuroLift_history', 'neuroLift_templates', 'neuroLift_weekly_schedule', 'neuroLift_rest_seconds', 'language'];
  for (const key of retained) safeStorage.setItem(key, 'keep');
  clearSessionDraft();
  clearSessionDraft();
  for (const key of SESSION_DRAFT_KEYS) expect(safeStorage.getItem(key)).toBeNull();
  for (const key of retained) expect(safeStorage.getItem(key)).toBe('keep');
});

test('cleanup cannot discard another workspace draft', () => {
  safeStorage.setItem('neuroLift_tracker_active_exercises', 'guest draft');
  changeScope('1');
  safeStorage.setItem('neuroLift_tracker_active_exercises', 'account draft');
  clearSessionDraft();
  changeScope('guest');
  expect(safeStorage.getItem('neuroLift_tracker_active_exercises')).toBe('guest draft');
});
