import { WorkoutSet } from '../types';

/** References never replace the plan or overwrite something the user has logged. */
export function copyPreviousSets(current: WorkoutSet[], previous: WorkoutSet[], onlyIndex?: number): WorkoutSet[] {
  return current.map((set, index) => {
    const reference = previous[index];
    if ((onlyIndex !== undefined && index !== onlyIndex) || set.completed || set.weight || set.reps || set.durationSeconds
      || !reference?.completed || reference.reps <= 0 || reference.durationSeconds) return set;
    return { ...set, weight: reference.weight, reps: reference.reps, completed: false };
  });
}
