import { ActiveExercise, CompletedWorkout, JournalEntry, WorkoutTemplate } from '../../types';
import { SESSION_CLOCK_KEYS, SESSION_DRAFT_KEYS } from '../sessionDraft';
import { validateBackup } from '../validateBackup';
import { SYNC_KEYS, Workspace } from '../workspace';

export interface TrainingCollections {
  workouts: CompletedWorkout;
  journal: JournalEntry;
  templates: WorkoutTemplate;
  schedule: { templateId: string };
}
export type RecordKind = keyof TrainingCollections;
export type TrainingRecord = {
  [K in RecordKind]: {
    owner: string; kind: K; id: string; revision: number;
    value: TrainingCollections[K]; deleted: boolean;
  }
}[RecordKind];

export interface MigrationCandidate {
  owner: string;
  schema: 1;
  records: TrainingRecord[];
  draft: Record<string, string>;
  settings: Record<string, string>;
  source: Workspace;
}

export function assertOwner(owner: string) {
  if (!/^(guest|[0-9]+)$/.test(owner)) throw new Error('Invalid account scope');
}

type Entry = { id?: string };
/** Deterministic upgrade IDs, unrelated to translated exercise names. */
function identify<T extends Entry>(entries: T[], parent: string): (T & { id: string })[] {
  const occupied = new Set<string>();
  for (const entry of entries) {
    if (entry.id !== undefined) {
      if (typeof entry.id !== 'string' || !entry.id || occupied.has(entry.id)) {
        throw new Error('Invalid or duplicate entry ID');
      }
      occupied.add(entry.id);
    }
  }
  return entries.map((entry, index) => {
    if (entry.id) return { ...entry, id: entry.id };
    const base = `${parent}:${index}`;
    let id = base;
    for (let suffix = 1; occupied.has(id); suffix++) id = `${base}:${suffix}`;
    occupied.add(id);
    return { ...entry, id };
  });
}

function identifyExercises(exercises: ActiveExercise[], parent: string) {
  return identify(exercises as (ActiveExercise & Entry)[], parent).map(exercise => ({
    ...exercise,
    sets: identify(exercise.sets, `${parent}:sets:${encodeURIComponent(exercise.id)}`),
  }));
}

/** Pure preflight: no storage writes, no source deletion, no active-account lookup. */
export function prepareLegacyMigration(owner: string, input: Workspace): MigrationCandidate {
  assertOwner(owner);
  if (!input || !Number.isSafeInteger(input.version) || input.version < 0
    || typeof input.dirty !== 'boolean' || !input.data || Array.isArray(input.data)
    || typeof input.data !== 'object' || Object.values(input.data).some(value => typeof value !== 'string')) {
    throw new Error('Invalid workspace envelope');
  }
  const source: Workspace = structuredClone(input);
  const data = source.data;
  const structuredKeys = new Set([
    'neuroLift_history', 'neuroLift_templates', 'neuroLift_journal',
    'neuroLift_weekly_schedule', 'neuroLift_user_profile', 'neuroLift_cal_history',
  ]);
  const backupData = Object.fromEntries(SYNC_KEYS.filter(key => data[key] !== undefined)
    .map(key => [key, structuredKeys.has(key) ? JSON.parse(data[key]) : data[key]]));
  if (Object.keys(backupData).length) validateBackup({ version: 1, data: backupData });

  const records: TrainingRecord[] = [];
  const workouts: CompletedWorkout[] = JSON.parse(data.neuroLift_history || '[]');
  for (const workout of workouts) records.push({ owner, kind: 'workouts', id: workout.id,
    revision: 1, deleted: false, value: { ...workout,
      exercises: identifyExercises(workout.exercises, `legacy-workout:${encodeURIComponent(workout.id)}`) } });
  const journal: JournalEntry[] = JSON.parse(data.neuroLift_journal || '[]');
  for (const entry of journal) records.push({ owner, kind: 'journal', id: entry.id,
    revision: 1, deleted: false, value: entry });
  const templates: WorkoutTemplate[] = JSON.parse(data.neuroLift_templates || '[]');
  for (const template of templates) records.push({ owner, kind: 'templates', id: template.id,
    revision: 1, deleted: false, value: { ...template,
      exercises: identify(template.exercises as (WorkoutTemplate['exercises'][number] & Entry)[],
        `legacy-template:${encodeURIComponent(template.id)}`) } });
  const schedule: Record<string, string> = JSON.parse(data.neuroLift_weekly_schedule || '{}');
  for (const [day, templateId] of Object.entries(schedule)) records.push({ owner, kind: 'schedule', id: day,
    revision: 1, deleted: false, value: { templateId } });

  const draftKeys = new Set<string>([...SESSION_DRAFT_KEYS, ...SESSION_CLOCK_KEYS]);
  const collectionKeys = new Set(['neuroLift_history', 'neuroLift_templates', 'neuroLift_journal', 'neuroLift_weekly_schedule']);
  const draft = Object.fromEntries(Object.entries(data).filter(([key]) => draftKeys.has(key)));
  const settings = Object.fromEntries(Object.entries(data).filter(([key]) => !draftKeys.has(key) && !collectionKeys.has(key)));
  if (draft.neuroLift_tracker_active_exercises !== undefined) {
    const exercises: ActiveExercise[] = JSON.parse(draft.neuroLift_tracker_active_exercises);
    validateBackup({ version: 1, data: { neuroLift_history: [{ id: 'draft-validation',
      date: '2000-01-01', durationSeconds: 0, totalVolume: 0, exercises }] } });
    if (exercises.length) {
      const sessionId = draft.neuroLift_tracker_session_id || `legacy-session:${owner}`;
      draft.neuroLift_tracker_session_id = sessionId;
      draft.neuroLift_tracker_active_exercises = JSON.stringify(identifyExercises(exercises, sessionId));
    }
  }
  return { owner, schema: 1, records, draft, settings, source };
}
