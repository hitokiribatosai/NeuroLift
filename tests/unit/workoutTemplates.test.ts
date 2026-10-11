import { expect, test } from 'vitest';
import { createFreshTemplateExercises } from '../../utils/workoutTemplates';
import { WorkoutTemplate } from '../../types';

test('starting a template creates planned set rows with all workout entries blank', () => {
  const template: WorkoutTemplate = {
    id: 'template-1',
    name: 'Sunday strength',
    createdAt: '2026-01-01T00:00:00.000Z',
    exercises: [
      { name: 'Squat', targetSets: 3, targetReps: '6-8' },
      { name: 'Plank', targetSets: 2, targetReps: '30 seconds' }
    ]
  };
  let nextId = 0;

  const exercises = createFreshTemplateExercises(template, () => `set-${++nextId}`);

  expect(exercises.map(exercise => exercise.name)).toEqual(['Squat', 'Plank']);
  expect(exercises[0].targetReps).toBe('6-8');
  expect(exercises[0].sets).toHaveLength(3);
  expect(exercises[1].sets).toHaveLength(2);
  expect(exercises.flatMap(exercise => exercise.sets).every(set =>
    set.weight === 0 && set.reps === 0 && !set.completed
  )).toBe(true);
});

test('a legacy template with an invalid set count still starts with one blank set', () => {
  const template: WorkoutTemplate = {
    id: 'legacy',
    name: 'Legacy',
    createdAt: '2026-01-01T00:00:00.000Z',
    exercises: [{ name: 'Push-up', targetSets: 0, targetReps: '10' }]
  };

  expect(createFreshTemplateExercises(template, () => 'set-id')[0].sets).toEqual([
    { id: 'set-id', weight: 0, reps: 0, completed: false }
  ]);
});
