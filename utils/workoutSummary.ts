import { WorkoutSet } from '../types';
import { hasSetEffort } from './workoutValidation';

export function summarizeSets(sets: WorkoutSet[]) {
  const completed = sets.filter(set => set.completed && hasSetEffort(set));
  return {
    sets: completed,
    volume: completed.reduce((sum, set) => sum + set.weight * set.reps, 0),
    reps: completed.reduce((sum, set) => sum + set.reps, 0),
    seconds: completed.reduce((sum, set) => sum + (set.durationSeconds || 0), 0),
  };
}
