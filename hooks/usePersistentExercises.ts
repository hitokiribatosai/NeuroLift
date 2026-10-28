import { Dispatch, SetStateAction, useCallback, useRef, useState } from 'react';
import { ActiveExercise } from '../types';
import { generateId } from '../utils/id';
import { safeStorage } from '../utils/storage';
import { scope } from '../utils/workspace';

/** Enqueue set edits in the event handler, before React schedules a render. */
export function usePersistentExercises(): [ActiveExercise[], Dispatch<SetStateAction<ActiveExercise[]>>] {
  const owner = useRef(scope());
  const [exercises, setExercises] = useState<ActiveExercise[]>(() =>
    safeStorage.getParsed<ActiveExercise[]>('neuroLift_tracker_active_exercises', [])
      .map(exercise => ({ ...exercise, id: exercise.id || generateId() })));
  const current = useRef(exercises);
  const update: Dispatch<SetStateAction<ActiveExercise[]>> = useCallback(action => {
    if (scope() !== owner.current) return;
    const next = (typeof action === 'function' ? action(current.current) : action)
      .map(exercise => ({ ...exercise, id: exercise.id || generateId() }));
    // The storage view updates synchronously; its pending status lasts until commit.
    safeStorage.setItems({ neuroLift_tracker_active_exercises: next.length ? JSON.stringify(next) : null });
    current.current = next;
    setExercises(next);
  }, []);
  return [exercises, update];
}
