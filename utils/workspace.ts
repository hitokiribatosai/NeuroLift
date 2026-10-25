export const SYNC_KEYS = [
 'neuroLift_history', 'neuroLift_journal', 'neuroLift_templates', 'neuroLift_weekly_schedule',
 'neuroLift_cal_history', 'neuroLift_cal_date', 'neuroLift_daily_cal',
 'neuroLift_user_profile', 'neuroLift_userGoal', 'neuroLift_units',
 'neuroLift_hasCompletedOnboarding', 'neuroLift_onboarding_completed',
] as const;
export type Workspace = { data: Record<string, string>; version: number; dirty: boolean };
// Each tab keeps its own scope: another tab signing in must never redirect our writes.
let activeOwner = localStorage.getItem('neuroLift_active_owner') || 'guest';
export const scope = () => activeOwner;
const key = () => 'neuroLift_workspace_' + scope();
let database: Awaited<ReturnType<typeof openTrainingDatabase>> | null = null;
const views = new Map<string, Workspace>();
let queue: Promise<unknown> = Promise.resolve();
let pending = 0;
let failure = '';
let channel: BroadcastChannel | undefined;
export const persistenceState = () => ({ pending, failure });
export const databaseEnabled = () => database !== null;
const announcePersistence = () => window.dispatchEvent(new Event('persistence-status'));

function legacyWorkspace(owner: string): Workspace {
 const raw = localStorage.getItem('neuroLift_workspace_' + owner);
 return raw ? JSON.parse(raw) : { data: {}, version: 0, dirty: false };
}

export async function initializeWorkspace() {
 if (database) return;
 const candidate = await openTrainingDatabase();
 const owner = scope();
 try {
  const view = await candidate.activate(owner, legacyWorkspace(owner));
  if (owner !== scope()) throw new Error('Account changed during initialization');
  views.set(owner, view);
  database = candidate;
 } catch (error) {
  candidate.close();
  throw error;
 }
 if (typeof BroadcastChannel !== 'undefined') {
  channel = new BroadcastChannel('neurolift-training-changes');
  channel.onmessage = async event => {
   if (event.data !== scope() || pending || failure || !database) return;
   const owner = scope();
   try {
    const snapshot = await database.read(owner);
    if (owner !== scope() || pending || failure) return;
    if (!snapshot) throw new Error('This account cache was removed in another tab. Reload to continue.');
    views.set(owner, database.workspaceFrom(snapshot));
    window.dispatchEvent(new Event('workspace-refreshed'));
   } catch (error) {
    if (owner !== scope()) return;
    failure = error instanceof Error ? error.message : 'Unable to refresh local data';
    announcePersistence();
   }
  };
 }
}
export async function flushWorkspace() {
 await queue;
 if (failure) throw new Error(failure);
}
export function readWorkspace(): Workspace {
 if (database) {
  const view = views.get(scope());
  if (!view) throw new Error('Workspace is not initialized');
  return structuredClone(view);
 }
 const raw = localStorage.getItem(key());
 if (!raw) return { data: {}, version: 0, dirty: false };
 const parsed = JSON.parse(raw);
 if (!parsed || !parsed.data || typeof parsed.data !== 'object' || Array.isArray(parsed.data) || !Number.isInteger(parsed.version)) throw new Error('Local data is unreadable. Restore a backup before continuing.');
 return parsed;
}
export function writeWorkspace(value: Workspace, notify = true) {
 if (database) {
  if (failure) {
   const rejected = Promise.reject(new Error(failure));
   void rejected.catch(() => undefined);
   return rejected;
  }
  const owner = scope();
  const before = readWorkspace();
  const submitted = database.normalizeWorkspace(owner, value);
  views.set(owner, submitted);
  pending++; announcePersistence();
  const db = database;
  const job = queue.then(async () => {
   if (failure) throw new Error(failure);
   const saved = await db.patchWorkspace(owner, before, submitted);
   // Do not replace a view containing newer queued commands.
   if (views.get(owner) === submitted) views.set(owner, saved);
   channel?.postMessage(owner);
   if (notify) window.dispatchEvent(new Event('workspace-write'));
  });
  queue = job.catch(error => {
   failure = error instanceof Error ? error.message : 'Unable to save locally';
   window.dispatchEvent(new Event('storage-error'));
  }).finally(() => { pending--; announcePersistence(); });
  return job;
 }
 // One atomic localStorage write: quota failures propagate instead of pretending to save.
 try { localStorage.setItem(key(), JSON.stringify(value)); }
 catch { window.dispatchEvent(new CustomEvent('storage-error')); throw new Error('Unable to save locally. Export a backup and free device storage.'); }
 if (notify) window.dispatchEvent(new Event('workspace-write'));
 return Promise.resolve();
}
export function syncedData(data = readWorkspace().data) {
 return Object.fromEntries(SYNC_KEYS.filter(k => data[k] !== undefined).map(k => [k, data[k]]));
}
export function changeScope(owner: string) {
 if (!/^(guest|[0-9]+)$/.test(owner)) throw new Error('Invalid account scope');
 if (database) return switchDatabaseScope(owner);
 localStorage.setItem('neuroLift_active_owner', owner);
 activeOwner = owner;
 window.dispatchEvent(new Event('workspace-scope'));
 return Promise.resolve();
}
async function switchDatabaseScope(owner: string) {
 await flushWorkspace();
 const view = await database!.activate(owner, legacyWorkspace(owner));
 views.set(owner, view);
 localStorage.setItem('neuroLift_active_owner', owner);
 activeOwner = owner;
 window.dispatchEvent(new Event('workspace-scope'));
}
export async function applyRemote(data: Record<string, string>, version: number, owner = scope()) {
 await flushWorkspace();
 if (owner !== scope()) throw new Error('Account changed during synchronization');
 const state = readWorkspace();
 const next = { ...state.data };
 for (const k of SYNC_KEYS) delete next[k];
 Object.assign(next, data);
 await writeWorkspace({ data: next, version, dirty: false }, false);
 window.dispatchEvent(new Event('workspace-refreshed'));
}
export async function discardCurrentCache() {
 const owner = scope();
 await flushWorkspace();
 if (owner !== scope()) throw new Error('Account changed before cache deletion');
 if (database) await database.deleteWorkspace(owner);
 channel?.postMessage(owner);
 localStorage.removeItem('neuroLift_conflict_backup_' + owner);
 localStorage.removeItem('neuroLift_remote_backup_' + owner);
 localStorage.removeItem('neuroLift_workspace_' + owner);
 if (owner !== scope()) return;
 await changeScope('guest');
}
import { openTrainingDatabase } from './persistence/trainingDatabase';
