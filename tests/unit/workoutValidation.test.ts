import { expect, test } from 'vitest';
import { hasSetEffort } from '../../utils/workoutValidation';

test('empty sets cannot complete; bodyweight reps and timed effort can', () => {
  const set = { id: 'set', completed: false, weight: 0, reps: 0 };
  expect(hasSetEffort(set)).toBe(false);
  expect(hasSetEffort({ ...set, weight: 50 })).toBe(false);
  expect(hasSetEffort({ ...set, reps: 8 })).toBe(true);
  expect(hasSetEffort({ ...set, durationSeconds: 30 })).toBe(true);
  expect(hasSetEffort({ ...set, reps: NaN, durationSeconds: Infinity })).toBe(false);
});
