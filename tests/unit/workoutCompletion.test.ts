import { beforeEach, expect, test, vi } from 'vitest';
import legacy from '../fixtures/legacy-workspace.json';
import { CompletedWorkout } from '../../types';
import { changeScope, readWorkspace, writeWorkspace } from '../../utils/workspace';
import { commitCompletedWorkout, ensureSessionIdentity } from '../../utils/workoutCompletion';
import { clearSessionDraft, SESSION_CLOCK_KEYS, SESSION_DRAFT_KEYS } from '../../utils/sessionDraft';
import { validateBackup } from '../../utils/validateBackup';

beforeEach(() => { localStorage.clear(); changeScope('guest'); writeWorkspace(structuredClone(legacy)); });
function workout(): CompletedWorkout {
  return { id: ensureSessionIdentity(), date: '2026-10-25T12:00:00Z', durationSeconds: 60,
    exercises: [{ name: 'Bench Press', sets: [{ id: 'current-set', weight: 55, reps: 10, completed: true }] }], totalVolume: 0 };
}

test('legacy draft gets a persistent identity without altering sets or existing IDs', () => {
  const before = readWorkspace();
  const id = ensureSessionIdentity();
  expect(ensureSessionIdentity()).toBe(id);
  expect(readWorkspace().data).toEqual({ ...before.data, neuroLift_tracker_session_id: id });
});

test('completion commits history, dirty marker and draft/clock removal in one write', () => {
  const record = workout();
  const write = vi.spyOn(Storage.prototype, 'setItem');
  const saved = commitCompletedWorkout(record, 'guest');
  expect(write).toHaveBeenCalledTimes(1);
  expect(saved.totalVolume).toBe(550);
  const state = readWorkspace();
  expect(state.version).toBe(4);
  expect(state.dirty).toBe(true);
  expect(JSON.parse(state.data.neuroLift_history)).toEqual([saved, ...JSON.parse(legacy.data.neuroLift_history)]);
  for (const key of [...SESSION_DRAFT_KEYS, ...SESSION_CLOCK_KEYS]) expect(state.data[key]).toBeUndefined();
  expect(state.data.neuroLift_templates).toBe(legacy.data.neuroLift_templates);
  expect(state.data.neuroLift_weekly_schedule).toBe(legacy.data.neuroLift_weekly_schedule);
  expect(state.data.language).toBe('fr');
});

test('retry after reopen is a no-op and cannot erase a newer session', () => {
  const record = workout();
  const saved = commitCompletedWorkout(record, 'guest');
  const next = ensureSessionIdentity();
  expect(next).not.toBe(record.id);
  const before = readWorkspace();
  expect(commitCompletedWorkout({ ...record, totalVolume: 999 }, 'guest')).toEqual(saved);
  expect(readWorkspace()).toEqual(before);
});

test('quota failure preserves the exact session, timers and history for retry', () => {
  const record = workout();
  const before = readWorkspace();
  const write = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('quota'); });
  expect(() => commitCompletedWorkout(record, 'guest')).toThrow('Unable to save');
  expect(readWorkspace()).toEqual(before);
  write.mockRestore();
  commitCompletedWorkout(record, 'guest');
  expect(JSON.parse(readWorkspace().data.neuroLift_history)).toHaveLength(2);
});

test('account change during asynchronous preparation rejects the completion', () => {
  const record = workout();
  const guest = readWorkspace();
  changeScope('1');
  expect(() => commitCompletedWorkout(record, 'guest')).toThrow('Account changed');
  expect(readWorkspace().data).toEqual({});
  changeScope('guest');
  expect(readWorkspace()).toEqual(guest);
});

test('discarded/replaced session cannot be finished by a stale callback', () => {
  const record = workout();
  clearSessionDraft();
  ensureSessionIdentity();
  const before = readWorkspace();
  expect(() => commitCompletedWorkout(record, 'guest')).toThrow('Session changed');
  expect(readWorkspace()).toEqual(before);
});

test.each(['broken json', '{}', '[null]', '[{"id":"a"},{"id":"a"}]'])('corrupt history is never silently overwritten: %s', raw => {
  const record = workout();
  const state = readWorkspace();
  state.data.neuroLift_history = raw;
  writeWorkspace(state);
  expect(() => commitCompletedWorkout(record, 'guest')).toThrow();
  expect(readWorkspace()).toEqual(state);
});

test('empty or invalid completed sets leave the draft intact', () => {
  const record = workout();
  const before = readWorkspace();
  record.exercises[0].sets[0].reps = 0;
  expect(() => commitCompletedWorkout(record, 'guest')).toThrow('no completed effort');
  record.exercises[0].sets[0].reps = -1;
  expect(() => commitCompletedWorkout(record, 'guest')).toThrow('Invalid workout set');
  expect(readWorkspace()).toEqual(before);
});

test('legacy saved data remains accepted by backup validation', () => {
  const keys = ['neuroLift_history', 'neuroLift_templates', 'neuroLift_weekly_schedule'] as const;
  const data = Object.fromEntries(keys.map(key => [key, JSON.parse(legacy.data[key])]));
  expect(validateBackup({ version: 1, data })).toEqual(Object.fromEntries(keys.map(key => [key, legacy.data[key]])));
});
