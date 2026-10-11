import { ActiveExercise, WorkoutTemplate } from '../types';

/** Build a clean session plan from a template without carrying logged set data. */
export const createFreshTemplateExercises = (
  template: WorkoutTemplate,
  createSetId: () => string
): ActiveExercise[] => template.exercises.map(exercise => ({
  name: exercise.name,
  targetReps: exercise.targetReps,
  sets: Array.from({ length: Math.max(1, Math.floor(exercise.targetSets) || 1) }, () => ({
    id: createSetId(),
    weight: 0,
    reps: 0,
    completed: false
  }))
}));
