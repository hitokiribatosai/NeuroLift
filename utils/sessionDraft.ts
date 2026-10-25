import { readWorkspace, writeWorkspace } from './workspace';

export type TrackerPhase = 'setup' | 'selection' | 'active' | 'summary';
export function isTrackerPhase(value: unknown): value is TrackerPhase {
  return value === 'setup' || value === 'selection' || value === 'active' || value === 'summary';
}

export const SESSION_DRAFT_KEYS = [
  'neuroLift_tracker_session_id',
  'neuroLift_tracker_phase', 'neuroLift_tracker_muscles',
  'neuroLift_tracker_selected_exercises', 'neuroLift_tracker_active_exercises',
  'neuroLift_tracker_selected_template', 'neuroLift_tracker_active_template',
  'neuroLift_tracker_active_template_name', 'ui_picker_search',
  'ui_picker_muscle', 'ui_picker_subgroup', 'ui_session_exercise',
] as const;

export const SESSION_CLOCK_KEYS = [
  'neuroLift_workout_start_time', 'neuroLift_workout_paused_duration',
  'neuroLift_workout_active', 'neuroLift_rest_end_time',
] as const;

/** Mutates only the caller's uncommitted workspace copy. */
export function removeSessionData(data: Record<string, string>) {
  for (const key of [...SESSION_DRAFT_KEYS, ...SESSION_CLOCK_KEYS]) delete data[key];
}

/** Only clears the device-local draft, never history, routines or preferences. */
export function clearSessionDraft() {
  const state = readWorkspace();
  if (![...SESSION_DRAFT_KEYS, ...SESSION_CLOCK_KEYS].some(key => key in state.data)) return;
  removeSessionData(state.data);
  return writeWorkspace(state);
}
