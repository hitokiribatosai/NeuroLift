import { CompletedWorkout } from '../types';
import { generateId } from './id';
import { removeSessionData } from './sessionDraft';
import { validateBackup } from './validateBackup';
import { hasSetEffort } from './workoutValidation';
import { readWorkspace, scope, writeWorkspace } from './workspace';

const SESSION_ID = 'neuroLift_tracker_session_id';
const HISTORY = 'neuroLift_history';

/** Assigned before finishing; old active drafts receive an ID without changing sets. */
export function ensureSessionIdentity(): string {
  const state = readWorkspace();
  if (state.data[SESSION_ID]) return state.data[SESSION_ID];
  const id = generateId();
  state.data[SESSION_ID] = id;
  writeWorkspace(state);
  return id;
}

function readHistory(raw: string | undefined): CompletedWorkout[] {
  if (raw === undefined) return [];
  // Never replace unreadable existing history with an empty collection. Preserve
  // legacy fields unchanged; full normalization belongs to the versioned migration.
  const value: unknown = JSON.parse(raw);
  if (!Array.isArray(value)) throw new Error('Unreadable workout history');
  const ids = new Set<string>();
  for (const record of value) {
    if (!record || typeof record !== 'object' || typeof record.id !== 'string'
      || !record.id || ids.has(record.id)) throw new Error('Unreadable workout history');
    ids.add(record.id);
  }
  return value;
}

/** Shared rules for the current workspace and the staged IndexedDB repository. */
export function normalizeCompletedWorkout(record: CompletedWorkout): CompletedWorkout {
  validateBackup({ version: 1, data: { [HISTORY]: [record] } });
  if (!record.exercises.some(exercise => exercise.sets.some(set => set.completed && hasSetEffort(set)))) {
    throw new Error('Workout has no completed effort');
  }
  const totalVolume = record.exercises.reduce((total, exercise) => total + exercise.sets.reduce(
    (sum, set) => sum + (set.completed && hasSetEffort(set) ? set.weight * set.reps : 0), 0), 0);
  if (!Number.isFinite(totalVolume)) throw new Error('Invalid workout volume');
  return { ...record, totalVolume };
}

/**
 * Current-storage transaction boundary. One setItem commits history, cleanup and
 * the snapshot dirty marker together. No await or UI/native side effects here.
 * This is not a multi-tab lock; IndexedDB transactions replace it in stage 3.
 */
export function commitCompletedWorkout(record: CompletedWorkout, owner: string): CompletedWorkout {
  if (scope() !== owner) throw new Error('Account changed while finishing');
  const state = readWorkspace();
  const history = readHistory(state.data[HISTORY]);
  const existing = history.find(workout => workout.id === record.id);
  // Retry is a no-op, including when a different session has since started.
  if (existing) return existing;
  if (!record.id || state.data[SESSION_ID] !== record.id) throw new Error('Session changed while finishing');
  const completed = normalizeCompletedWorkout(record);
  state.data[HISTORY] = JSON.stringify([completed, ...history]);
  removeSessionData(state.data);
  state.dirty = true;
  writeWorkspace(state);
  return completed;
}
