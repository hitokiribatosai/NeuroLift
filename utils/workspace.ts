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
let refreshRequested = false;
let scopeQueue: Promise<void> = Promise.resolve();
export const persistenceState = () => ({ pending, failure });
export const databaseEnabled = () => database !== null;
export async function recordSyncSnapshot(owner = scope()) {
 await flushWorkspace();
 if (owner !== scope()) throw new Error('Account changed during synchronization');
 return database ? database.read(owner) : null;
}
/** Serializes sync transactions with local commands and never changes their owner. */
export function recordSyncCommand<T>(owner: string, command: (db: NonNullable<typeof database>) => Promise<T>) {
 if (!database || owner !== scope()) return Promise.reject(new Error('Account database is not available'));
 const db = database;
 pending++; announcePersistence();
 const job = queue.then(async () => {
  if (failure) throw new Error(failure);
  if (owner !== scope()) throw new Error('Account changed during synchronization');
  const previousView = views.get(owner);
  const result = await command(db);
  const snapshot = await db.read(owner);
  if (!snapshot) throw new Error('Account database was removed');
  if (owner === scope() && views.get(owner) === previousView) {
   const next = db.workspaceFrom(snapshot);
   views.set(owner, next);
   if (JSON.stringify(previousView?.data) !== JSON.stringify(next.data)) window.dispatchEvent(new Event('workspace-refreshed'));
  }
  channel?.postMessage(owner);
  return result;
 });
 queue = job.catch(() => undefined).finally(() => { pending--; announcePersistence(); void refreshFromDatabase(); });
 return job;
}
/** Explicit recovery artifact; never treated as an ordinary import or uploaded. */
export async function readRecoveryBundle() {
 const owner = scope();
 const legacy = localStorage.getItem('neuroLift_workspace_' + owner);
 const unsavedView = views.get(owner) ? structuredClone(views.get(owner)) : null;
 let durable: Awaited<ReturnType<NonNullable<typeof database>['read']>> = null;
 let databaseReadable = false;
 let previousRecoveries: Awaited<ReturnType<NonNullable<typeof database>['recoveryCopies']>> = [];
 let recoveryConnection: Awaited<ReturnType<typeof openTrainingDatabase>> | null = null;
 try {
  recoveryConnection = database || await openTrainingDatabase();
  durable = await recoveryConnection.read(owner); databaseReadable = true;
  previousRecoveries = await recoveryConnection.recoveryCopies(owner);
 } catch { /* Preserve remaining copies even when IndexedDB cannot open. */ }
 finally { if (recoveryConnection && recoveryConnection !== database) recoveryConnection.close(); }
 return { format: 'neurolift-recovery', version: 1, owner, createdAt: new Date().toISOString(),
  legacy, unsavedView, durable, previousRecoveries, databaseReadable };
}

/** Only used by startup recovery; never automatically chooses a winning copy. */
export async function reconciliationOptions() {
 if (database) return null;
 const owner = scope();
 const source = legacyWorkspace(owner);
 const candidate = await openTrainingDatabase();
 try {
  candidate.normalizeWorkspace(owner, source);
  const snapshot = await candidate.read(owner);
  if (!snapshot || JSON.stringify(snapshot.metadata.acceptedSource ?? snapshot.metadata.source) === JSON.stringify(source)) return null;
  return { owner, source, generation: snapshot.metadata.generation };
 } finally { candidate.close(); }
}
export async function reconcileWorkspace(options: NonNullable<Awaited<ReturnType<typeof reconciliationOptions>>>, choice: 'database' | 'legacy') {
 if (database || options.owner !== scope() || JSON.stringify(legacyWorkspace(options.owner)) !== JSON.stringify(options.source)) {
  throw new Error('Workspace changed. Reload and review recovery again.');
 }
 const candidate = await openTrainingDatabase();
 try { await candidate.reconcile(options.owner, options.source, choice, options.generation); }
 finally { candidate.close(); }
}
const announcePersistence = () => window.dispatchEvent(new Event('persistence-status'));
export function reportPersistenceFailure(error: unknown) {
 if (database) {
  failure = error instanceof Error ? error.message : 'Unable to save locally';
  announcePersistence();
 }
 window.dispatchEvent(new Event('storage-error'));
}

async function refreshFromDatabase() {
 if (!refreshRequested || pending || failure || !database) return;
 const owner = scope();
 refreshRequested = false;
 try {
  const snapshot = await database.read(owner);
  if (owner !== scope()) return;
  if (pending) { refreshRequested = true; return; }
  if (failure) return;
  if (!snapshot) throw new Error('This account cache was removed in another tab. Reload to continue.');
  views.set(owner, database.workspaceFrom(snapshot));
  window.dispatchEvent(new Event('workspace-refreshed'));
 } catch (error) {
  if (owner !== scope()) return;
  failure = error instanceof Error ? error.message : 'Unable to refresh local data';
  announcePersistence();
 }
}

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
  channel.onmessage = event => {
   if (event.data !== scope()) return;
   refreshRequested = true;
   void refreshFromDatabase();
  };
 }
}
export function flushWorkspace() {
 const flushed = queue.then(() => { if (failure) throw new Error(failure); });
 // Effects may ignore the promise; awaited command callers still receive errors.
 void flushed.catch(() => undefined);
 return flushed;
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
  let submitted: Workspace;
  try { submitted = database.normalizeWorkspace(owner, value); }
  catch (error) { reportPersistenceFailure(error); throw error; }
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
  }).finally(() => { pending--; announcePersistence(); void refreshFromDatabase(); });
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
 if (database) {
  const next = scopeQueue.then(() => switchDatabaseScope(owner));
  scopeQueue = next.catch(() => undefined);
  return next;
 }
 localStorage.setItem('neuroLift_active_owner', owner);
 activeOwner = owner;
 window.dispatchEvent(new Event('workspace-scope'));
 return Promise.resolve();
}
async function switchDatabaseScope(owner: string) {
 await flushWorkspace();
 await database!.activate(owner, legacyWorkspace(owner));
 // Writes made while opening the target remain owned by the outgoing account.
 // Drain before refreshing the target so a same-account switch cannot regress it.
 let observed: Promise<unknown>;
 do { observed = queue; await flushWorkspace(); } while (observed !== queue);
 const snapshot = await database!.read(owner);
 if (!snapshot) throw new Error('Target workspace disappeared during account switch');
 views.set(owner, database!.workspaceFrom(snapshot));
 localStorage.setItem('neuroLift_active_owner', owner);
 activeOwner = owner;
 window.dispatchEvent(new Event('workspace-scope'));
}
export async function applyRemote(data: Record<string, string>, version: number, owner = scope()) {
 await flushWorkspace();
 if (owner !== scope()) throw new Error('Account changed during synchronization');
 if (database) {
  const snapshot = await database.read(owner);
  if (snapshot?.metadata.recordSync || snapshot?.metadata.enrollment) throw new Error('Legacy snapshots cannot replace record-mode data');
 }
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
