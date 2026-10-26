import { api, signedIn, ApiError } from './authService';
import { flushWorkspace, readWorkspace, writeWorkspace, syncedData, applyRemote, scope, recordSyncSnapshot, recordSyncCommand } from './workspace';
import { synchronizeRecords } from './recordSync';
import { PendingRecord } from './persistence/recordSyncState';
export type ServerSnapshot = { version: number; data: Record<string, string> };
export type SyncStatus = 'signed-out' | 'idle' | 'syncing' | 'saved' | 'offline' | 'conflict' | 'error';
let status: SyncStatus = 'signed-out';
let problem = '';
let busy = false;
let conflict: ServerSnapshot | null = null;
let recordConflicts: PendingRecord[] = [];
export const syncState = () => ({ status, problem, conflict, recordConflicts });
function announce(next: SyncStatus, message = '') {
 status = next; problem = message; window.dispatchEvent(new Event('sync-status'));
}
export async function syncNow(resolution?: 'local' | 'remote', pushOnly = false) {
 if (busy) return;
 if (!signedIn()) { announce('signed-out'); return; }
 if (!navigator.onLine) { announce('offline'); return; }
 if (conflict && !resolution) { announce('conflict'); return; }
 const owner = scope();
 busy = true; announce('syncing');
 try {
  await flushWorkspace();
  if (owner !== scope()) return;
  if ((await recordSyncSnapshot(owner))?.metadata.recordSync) {
   const records = await synchronizeRecords(owner);
   if (owner !== scope()) return;
   recordConflicts = Object.values(records.pending).filter(record => record.conflict);
   announce(recordConflicts.length ? 'conflict' : Object.keys(records.pending).length ? 'idle' : 'saved');
   return;
  }
  const remote = await api<ServerSnapshot>('/snapshot/');
  if (owner !== scope()) return;
  const local = readWorkspace();
  if (resolution === 'remote') {
   // Preserve overwritten local data as a recovery copy before an explicit choice.
   localStorage.setItem('neuroLift_conflict_backup_' + owner, JSON.stringify(local));
   await applyRemote(remote.data, remote.version, owner); conflict = null; announce('saved'); return;
  }
  const data = syncedData(local.data);
  if (!local.dirty && !resolution) {
   if (!pushOnly && JSON.stringify(data) !== JSON.stringify(syncedData(remote.data))) await applyRemote(remote.data, remote.version, owner);
   else if (local.version !== remote.version && !pushOnly) await writeWorkspace({ ...local, version: remote.version }, false);
   announce('saved'); return;
  }
  if (local.version !== remote.version && resolution !== 'local') {
   conflict = remote; announce('conflict'); return;
  }
  if (resolution === 'local') localStorage.setItem('neuroLift_remote_backup_' + owner, JSON.stringify(remote));
  const result = await api<ServerSnapshot>('/snapshot/', 'PUT', { version: remote.version, data });
  if (owner !== scope()) return;
  // Edits made while the request was running remain dirty for the next sync.
  const latest = readWorkspace();
  const dirty = JSON.stringify(syncedData(latest.data)) !== JSON.stringify(data);
  await writeWorkspace({ ...latest, version: result.version, dirty }, false);
  conflict = null; announce(dirty ? 'idle' : 'saved');
 } catch (e) {
  if (owner !== scope()) return;
  if (e instanceof ApiError && e.status === 409) { conflict = { version: -1, data: {} }; announce('conflict'); }
  else announce(navigator.onLine ? 'error' : 'offline', e instanceof Error ? e.message : 'Sync failed');
 } finally {
  busy = false;
  if (status === 'idle' && signedIn() && readWorkspace().dirty) setTimeout(() => void syncNow(undefined, true), 1500);
 }
}
export async function resolveSyncRecord(record: PendingRecord, choice: 'local' | 'remote') {
 if (!record.conflict || busy) return;
 const owner = scope();
 busy = true;
 try {
  await recordSyncCommand(owner, db => db.resolveRecordConflict(owner, record.desired.kind, record.desired.id, choice, record.conflict!.revision));
  recordConflicts = [];
 } catch (error) {
  announce('error', error instanceof Error ? error.message : 'Unable to resolve conflict');
  return;
 } finally { busy = false; }
 await syncNow();
}
let timer: ReturnType<typeof setTimeout>;
export function startSync() {
 const push = () => { clearTimeout(timer); timer = setTimeout(() => { if (readWorkspace().dirty) void syncNow(undefined, true); }, 1500); };
 const reset = () => { conflict = null; recordConflicts = []; announce(signedIn() ? 'idle' : 'signed-out'); };
 const online = () => { if (signedIn()) void syncNow(); };
 const foreground = () => { if (document.visibilityState === 'visible') online(); };
 // Retry durable pending work after transient server failures without requiring
 // another edit. Do not keep a sleeping preview server awake for idle accounts.
 const retry = setInterval(() => {
  if (document.visibilityState !== 'visible' || !signedIn() || !navigator.onLine || busy || status === 'conflict') return;
  try { if (readWorkspace().dirty) void syncNow(undefined, true); } catch { /* Recovery UI owns unreadable storage. */ }
 }, 30000);
 window.addEventListener('workspace-write', push);
 window.addEventListener('online', online);
 window.addEventListener('account-changed', reset);
 document.addEventListener('visibilitychange', foreground);
 return () => { clearTimeout(timer); clearInterval(retry); document.removeEventListener('visibilitychange', foreground); window.removeEventListener('workspace-write', push); window.removeEventListener('online', online); window.removeEventListener('account-changed', reset); };
}
