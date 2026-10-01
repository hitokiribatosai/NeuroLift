import { CompletedWorkout, JournalEntry, WorkoutTemplate } from '../types';
import { dbStorage } from './db';
import { readWorkspace, writeWorkspace, SYNC_KEYS, scope } from './workspace';

export const safeStorage = {
 getItem(key: string): string | null { return readWorkspace().data[key] ?? null; },
 setItem(key: string, value: string): void {
  const state = readWorkspace();
  if (state.data[key] === value) return;
  state.data[key] = value;
  state.dirty ||= (SYNC_KEYS as readonly string[]).includes(key);
  writeWorkspace(state);
 },
 removeItem(key: string): void {
  const state = readWorkspace();
  if (!(key in state.data)) return;
  delete state.data[key];
  state.dirty ||= (SYNC_KEYS as readonly string[]).includes(key);
  writeWorkspace(state);
 },
 getParsed<T>(key: string, fallback: T): T {
  const item = safeStorage.getItem(key);
  if (!item) return fallback;
  try { return JSON.parse(item) ?? fallback; } catch { return fallback; }
 },
 async getWorkout(id: string) { return (await safeStorage.getAllWorkouts()).find(w => w.id === id); },
 async saveWorkout(id: string, workout: CompletedWorkout) { upsert('neuroLift_history', id, workout); },
 async getAllWorkouts(): Promise<CompletedWorkout[]> { return safeStorage.getParsed('neuroLift_history', []); },
 async getJournalEntry(id: string) { return (await safeStorage.getAllJournalEntries()).find(e => e.id === id); },
 async saveJournalEntry(id: string, entry: JournalEntry) { upsert('neuroLift_journal', id, entry); },
 async getAllJournalEntries(): Promise<JournalEntry[]> { return safeStorage.getParsed('neuroLift_journal', []); },
 async saveTemplate(id: string, template: WorkoutTemplate) { upsert('neuroLift_templates', id, template); },
 async getTemplates(): Promise<WorkoutTemplate[]> { return safeStorage.getParsed('neuroLift_templates', []); },
 async deleteTemplate(id: string) {
  safeStorage.setItem('neuroLift_templates', JSON.stringify((await safeStorage.getTemplates()).filter(t => t.id !== id)));
 },
};
function upsert<T extends { id: string }>(key: string, id: string, value: T) {
 const values = safeStorage.getParsed<T[]>(key, []);
 safeStorage.setItem(key, JSON.stringify([value, ...values.filter(v => v.id !== id)]));
}
export async function migrateLegacyStorage() {
 if (scope() !== 'guest' || localStorage.getItem('neuroLift_workspace_guest')) return;
 const data: Record<string, string> = {};
 for (let i = 0; i < localStorage.length; i++) {
  const k = localStorage.key(i)!;
  if ((k.startsWith('neuroLift_') && !k.startsWith('neuroLift_workspace_') && k !== 'neuroLift_active_owner') || k === 'language') data[k] = localStorage.getItem(k)!;
 }
 // Only recover historical stores where no canonical collection exists.
 // Templates previously lived in both stores; merge unique IDs without replacing local records.
 for (const [store, k] of [['workouts','neuroLift_history'],['journal','neuroLift_journal'],['templates','neuroLift_templates']] as const) {
  try {
   const legacy = await dbStorage.getAll(store);
   if (!data[k]) data[k] = JSON.stringify(legacy);
   else if (store === 'templates') {
    const current = JSON.parse(data[k]);
    data[k] = JSON.stringify([...current, ...legacy.filter(x => !current.some(y => y.id === x.id))]);
   }
  } catch { /* Existing localStorage data remains usable without IndexedDB. */ }
 }
 writeWorkspace({ data, version: 0, dirty: Object.keys(data).length > 0 }, false);
}
