import { safeStorage } from './storage';

export type TrackerPhase = 'setup' | 'selection' | 'active' | 'summary';
export function isTrackerPhase(value: unknown): value is TrackerPhase {
  return value === 'setup' || value === 'selection' || value === 'active' || value === 'summary';
}

export const SESSION_DRAFT_KEYS = [
  'neuroLift_tracker_phase', 'neuroLift_tracker_muscles',
  'neuroLift_tracker_selected_exercises', 'neuroLift_tracker_active_exercises',
  'neuroLift_tracker_selected_template', 'neuroLift_tracker_active_template',
  'neuroLift_tracker_active_template_name', 'ui_picker_search',
  'ui_picker_muscle', 'ui_picker_subgroup', 'ui_session_exercise',
] as const;

/** Only clears the device-local draft, never history, routines or preferences. */
export function clearSessionDraft() {
  for (const key of SESSION_DRAFT_KEYS) safeStorage.removeItem(key);
}
