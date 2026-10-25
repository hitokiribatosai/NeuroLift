import { expect, test } from 'vitest';
import fixture from '../fixtures/legacy-workspace.json';
import { prepareLegacyMigration } from '../../utils/persistence/legacyMigration';

test('migration preserves source, record IDs, set values, schedule and preferences', () => {
  const input = structuredClone(fixture);
  const candidate = prepareLegacyMigration('guest', input);
  expect(input).toEqual(fixture);
  expect(candidate.source).toEqual(fixture);
  expect(candidate.records.map(record => [record.kind, record.id])).toEqual([
    ['workouts', 'historic-workout'], ['templates', 'routine'], ['schedule', '0'],
  ]);
  const record = candidate.records.find(record => record.kind === 'workouts');
  if (record?.kind !== 'workouts') throw new Error('Missing workout');
  expect(record.value.exercises[0].sets[0]).toEqual({ id: 'historic-set', weight: 50, reps: 10, completed: true });
  expect(candidate.settings.language).toBe('fr');
  expect(candidate.settings.neuroLift_rest_seconds).toBe('120');
  expect(candidate.draft.neuroLift_workout_start_time).toBe(fixture.data.neuroLift_workout_start_time);
  expect(candidate.draft.neuroLift_tracker_session_id).toBe('legacy-session:guest');
  expect(prepareLegacyMigration('guest', input)).toEqual(candidate);
});

test('migration retains unknown metadata and all non-training synced categories', () => {
  const input = structuredClone(fixture);
  Object.assign(input.data, { customFuturePreference: 'unchanged', neuroLift_daily_cal: '2400',
    neuroLift_user_profile: '{"name":"Test"}', neuroLift_cal_history: '[{"date":"2026-10-25","calories":2400}]' });
  const candidate = prepareLegacyMigration('1', input);
  expect(candidate.records.every(record => record.owner === '1')).toBe(true);
  expect(candidate.settings.customFuturePreference).toBe('unchanged');
  expect(candidate.settings.neuroLift_daily_cal).toBe('2400');
  expect(candidate.settings.neuroLift_cal_history).toBe('[{"date":"2026-10-25","calories":2400}]');
});

test('empty workspaces are valid and malformed source is rejected without mutation', () => {
  expect(prepareLegacyMigration('guest', { data: {}, version: 0, dirty: false }).records).toEqual([]);
  const corrupt = { ...fixture, data: { ...fixture.data, neuroLift_history: 'broken' } };
  const before = structuredClone(corrupt);
  expect(() => prepareLegacyMigration('guest', corrupt)).toThrow();
  expect(corrupt).toEqual(before);
  expect(() => prepareLegacyMigration('../another-user', fixture)).toThrow('Invalid account scope');
  expect(() => prepareLegacyMigration('guest', { ...fixture, version: -1 })).toThrow('Invalid workspace');
});

test('missing entry IDs are deterministic, never rename explicit IDs or collide', () => {
  const workout = JSON.parse(fixture.data.neuroLift_history)[0];
  workout.exercises = [
    { name: 'A', sets: [{ weight: 10, reps: 10, completed: true }] },
    { id: 'legacy-workout:historic-workout:0', name: 'B', sets: [{ id: 'explicit-set', weight: 20, reps: 10, completed: true }] },
  ];
  const source = { ...fixture, data: { ...fixture.data, neuroLift_history: JSON.stringify([workout]) } };
  const record = prepareLegacyMigration('guest', source).records.find(record => record.kind === 'workouts');
  expect(record?.value.exercises).toMatchObject([
    { id: 'legacy-workout:historic-workout:0:1', sets: [{ id: expect.any(String), weight: 10 }] },
    { id: 'legacy-workout:historic-workout:0', sets: [{ id: 'explicit-set' }] },
  ]);
  expect(prepareLegacyMigration('guest', source).records).toEqual(prepareLegacyMigration('guest', source).records);
});

test('duplicate exercise or set IDs block migration rather than dropping entries', () => {
  const workout = JSON.parse(fixture.data.neuroLift_history)[0];
  workout.exercises[0].sets.push({ ...workout.exercises[0].sets[0] });
  const source = { ...fixture, data: { ...fixture.data, neuroLift_history: JSON.stringify([workout]) } };
  expect(() => prepareLegacyMigration('guest', source)).toThrow('duplicate entry ID');
});

test('unreadable active draft blocks migration; explicit existing session ID survives', () => {
  const source = { ...fixture, data: { ...fixture.data, neuroLift_tracker_active_exercises: '{}' } };
  expect(() => prepareLegacyMigration('guest', source)).toThrow();
  const candidate = prepareLegacyMigration('guest', { ...fixture, data: {
    ...fixture.data, neuroLift_tracker_session_id: 'existing-session',
  } });
  expect(candidate.draft.neuroLift_tracker_session_id).toBe('existing-session');
});
