import { expect, test } from 'vitest';
import { summarizeSets } from '../../utils/workoutSummary';
test('volume counts repetitions and completed sets only', () => {
  const sets = Array.from({ length: 3 }, (_, i) => ({ id: String(i), weight: 50, reps: 10, completed: true }));
  expect(summarizeSets([...sets, { id: 'skip', weight: 100, reps: 10, completed: false }])).toMatchObject({ volume: 1500, reps: 30 });
});
test('bodyweight and timed exercises retain meaningful totals', () => {
  expect(summarizeSets([{ id: 'bw', weight: 0, reps: 12, completed: true }])).toMatchObject({ volume: 0, reps: 12 });
  expect(summarizeSets([{ id: 'time', weight: 0, reps: 0, durationSeconds: 30, completed: true }])).toMatchObject({ seconds: 30 });
  expect(summarizeSets([{ id: 'empty', weight: 0, reps: 0, completed: true }]).sets).toHaveLength(0);
});
