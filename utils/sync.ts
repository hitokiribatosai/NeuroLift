import { api, signedIn, ApiError } from './authService';
import { readWorkspace, writeWorkspace, syncedData, applyRemote, scope } from './workspace';
export type ServerSnapshot = { version: number; data: Record<string, string> };
export type SyncStatus = 'signed-out' | 'idle' | 'syncing' | 'saved' | 'offline' | 'conflict' | 'error';
let status: SyncStatus = 'signed-out';
let problem = '';
let busy = false;
let conflict: ServerSnapshot | null = null;
export const syncState = () => ({ status, problem, conflict });
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
  const remote = await api<ServerSnapshot>('/snapshot/');
  if (owner !== scope()) return;
  const local = readWorkspace();
  if (resolution === 'remote') {
   // Preserve overwritten local data as a recovery copy before an explicit choice.
   localStorage.setItem('neuroLift_conflict_backup_' + owner, JSON.stringify(local));
   applyRemote(remote.data, remote.version); conflict = null; announce('saved'); return;
  }
  const data = syncedData(local.data);
  if (!local.dirty && !resolution) {
   if (!pushOnly && JSON.stringify(data) !== JSON.stringify(syncedData(remote.data))) applyRemote(remote.data, remote.version);
   else if (local.version !== remote.version && !pushOnly) writeWorkspace({ ...local, version: remote.version }, false);
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
  writeWorkspace({ ...latest, version: result.version, dirty }, false);
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
let timer: ReturnType<typeof setTimeout>;
export function startSync() {
 const push = () => { clearTimeout(timer); timer = setTimeout(() => { if (readWorkspace().dirty) void syncNow(undefined, true); }, 1500); };
 const reset = () => { conflict = null; announce(signedIn() ? 'idle' : 'signed-out'); };
 window.addEventListener('workspace-write', push);
 window.addEventListener('online', push);
 window.addEventListener('account-changed', reset);
 return () => { clearTimeout(timer); window.removeEventListener('workspace-write', push); window.removeEventListener('online', push); window.removeEventListener('account-changed', reset); };
}
