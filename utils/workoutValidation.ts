import { WorkoutSet } from '../types';

// Zero load is valid for bodyweight movements; an untouched set is not training.
export function hasSetEffort(set: WorkoutSet): boolean {
  return (Number.isFinite(set.reps) && set.reps > 0)
    || (Number.isFinite(set.durationSeconds) && (set.durationSeconds ?? 0) > 0);
}
