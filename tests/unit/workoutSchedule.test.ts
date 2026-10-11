import { expect, test } from 'vitest';
import { findNextScheduledWorkout } from '../../utils/workoutSchedule';
import { WorkoutTemplate } from '../../types';

const templates: WorkoutTemplate[] = [
  { id: 'push', name: 'Push', createdAt: '2026-01-01', exercises: [] },
  { id: 'legs', name: 'Legs', createdAt: '2026-01-01', exercises: [] }
];

test('finds today first, then the nearest upcoming scheduled routine', () => {
  const from = new Date(2026, 0, 5, 12); // Monday
  expect(findNextScheduledWorkout(templates, { '1': 'push', '3': 'legs' }, from)).toMatchObject({
    template: { id: 'push' }, daysUntil: 0
  });
  expect(findNextScheduledWorkout(templates, { '3': 'legs' }, from)).toMatchObject({
    template: { id: 'legs' }, daysUntil: 2
  });
});

test('returns no routine when no assigned template remains', () => {
  expect(findNextScheduledWorkout(templates, { '1': 'deleted' }, new Date(2026, 0, 5))).toBeNull();
});

test('moves past a scheduled template after it has been completed today', () => {
  const monday = new Date(2026, 0, 5, 12);
  const completed = [{
    id: 'workout-1', date: new Date(2026, 0, 5, 9).toISOString(), name: 'Push',
    durationSeconds: 1800, exercises: [], totalVolume: 0, templateId: 'push'
  }];
  expect(findNextScheduledWorkout(templates, { '1': 'push', '3': 'legs' }, monday, completed)).toMatchObject({
    template: { id: 'legs' }, daysUntil: 2
  });
});
