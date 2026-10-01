export const SYNC_KEYS = [
 'neuroLift_history', 'neuroLift_journal', 'neuroLift_templates',
 'neuroLift_cal_history', 'neuroLift_cal_date', 'neuroLift_daily_cal',
 'neuroLift_user_profile', 'neuroLift_userGoal', 'neuroLift_units',
 'neuroLift_hasCompletedOnboarding', 'neuroLift_onboarding_completed',
] as const;
export type Workspace = { data: Record<string, string>; version: number; dirty: boolean };
// Each tab keeps its own scope: another tab signing in must never redirect our writes.
let activeOwner = localStorage.getItem('neuroLift_active_owner') || 'guest';
export const scope = () => activeOwner;
const key = () => 'neuroLift_workspace_' + scope();
export function readWorkspace(): Workspace {
 const raw = localStorage.getItem(key());
 if (!raw) return { data: {}, version: 0, dirty: false };
 const parsed = JSON.parse(raw);
 if (!parsed || !parsed.data || typeof parsed.data !== 'object' || Array.isArray(parsed.data) || !Number.isInteger(parsed.version)) throw new Error('Local data is unreadable. Restore a backup before continuing.');
 return parsed;
}
export function writeWorkspace(value: Workspace, notify = true) {
 // One atomic localStorage write: quota failures propagate instead of pretending to save.
 try { localStorage.setItem(key(), JSON.stringify(value)); }
 catch { window.dispatchEvent(new CustomEvent('storage-error')); throw new Error('Unable to save locally. Export a backup and free device storage.'); }
 if (notify) window.dispatchEvent(new Event('workspace-write'));
}
export function syncedData(data = readWorkspace().data) {
 return Object.fromEntries(SYNC_KEYS.filter(k => data[k] !== undefined).map(k => [k, data[k]]));
}
export function changeScope(owner: string) {
 if (!/^(guest|[0-9]+)$/.test(owner)) throw new Error('Invalid account scope');
 localStorage.setItem('neuroLift_active_owner', owner);
 activeOwner = owner;
 window.dispatchEvent(new Event('workspace-scope'));
}
export function applyRemote(data: Record<string, string>, version: number) {
 const state = readWorkspace();
 const next = { ...state.data };
 for (const k of SYNC_KEYS) delete next[k];
 Object.assign(next, data);
 writeWorkspace({ data: next, version, dirty: false }, false);
 window.dispatchEvent(new Event('workspace-refreshed'));
}
export function discardCurrentCache() {
 localStorage.removeItem('neuroLift_conflict_backup_' + scope());
 localStorage.removeItem('neuroLift_remote_backup_' + scope());
 localStorage.removeItem(key());
 changeScope('guest');
}
