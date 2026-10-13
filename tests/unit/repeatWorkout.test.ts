import { expect, test } from 'vitest';
import { copyPreviousSets } from '../../utils/repeatWorkout';
const blank = (id: string) => ({ id, weight: 0, reps: 0, completed: false });
const previous = [{ id: 'old', weight: 25, reps: 10, completed: true }];

test('copy preserves planned rows and IDs, leaves unmatched sets blank and never completes them', () => {
  const current = [blank('one'), blank('two')];
  expect(copyPreviousSets(current, previous)).toEqual([{ ...current[0], weight: 25, reps: 10 }, current[1]]);
  expect(current[0].weight).toBe(0);
  expect(copyPreviousSets([blank('one')], [...previous, ...previous])).toHaveLength(1);
});
test('copy only the requested set without overwriting entered or completed data', () => {
  const current = [blank('one'), blank('two')];
  expect(copyPreviousSets(current, [...previous, ...previous], 1)).toEqual([current[0], { ...current[1], weight: 25, reps: 10 }]);
  for (const set of [{ ...blank('one'), weight: 5 }, { ...blank('one'), reps: 8 }, { ...blank('one'), completed: true }]) {
    expect(copyPreviousSets([set], previous)[0]).toBe(set);
  }
});
test('bodyweight references work; timed or incomplete references are not copied as reps', () => {
  expect(copyPreviousSets([blank('one')], [{ ...previous[0], weight: 0 }])[0].reps).toBe(10);
  for (const set of [{ ...previous[0], durationSeconds: 30 }, { ...previous[0], completed: false }]) {
    expect(copyPreviousSets([blank('one')], [set])[0]).toEqual(blank('one'));
  }
});
