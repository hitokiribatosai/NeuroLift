import { beforeEach, expect, test, vi } from 'vitest';
vi.mock('../../utils/authService', () => ({
 api: vi.fn(), signedIn: () => true, ApiError: class extends Error {constructor(message:string, public status:number){super(message);}}
}));
import { api } from '../../utils/authService';
import { changeScope, readWorkspace, writeWorkspace } from '../../utils/workspace';
import { safeStorage } from '../../utils/storage';
let sync: typeof import('../../utils/sync');
beforeEach(async () => {
 localStorage.clear(); changeScope('1'); vi.mocked(api).mockReset();
 // Conflict state belongs to an account/session and is cleared by its event.
 sync = await import('../../utils/sync'); const stop = sync.startSync();
 window.dispatchEvent(new Event('account-changed')); stop();
});
test('a fresh device pulls the same account snapshot', async () => {
 vi.mocked(api).mockResolvedValue({version:3,data:{neuroLift_daily_cal:'120'}});
 await sync.syncNow();
 expect(readWorkspace()).toEqual({version:3,data:{neuroLift_daily_cal:'120'},dirty:false});
});
test('key order cannot trigger repeated workspace remounts', async () => {
 writeWorkspace({version:2,dirty:false,data:{neuroLift_daily_cal:'100',neuroLift_hasCompletedOnboarding:'true'}});
 vi.mocked(api).mockResolvedValue({version:2,data:{neuroLift_hasCompletedOnboarding:'true',neuroLift_daily_cal:'100'}});
 const refresh = vi.fn();
 window.addEventListener('workspace-refreshed',refresh);
 try { await sync.syncNow(); expect(refresh).not.toHaveBeenCalled(); }
 finally { window.removeEventListener('workspace-refreshed',refresh); }
});
test('offline edits meet a newer remote version without overwriting it', async () => {
 safeStorage.setItem('neuroLift_daily_cal','100');
 vi.mocked(api).mockResolvedValue({version:3,data:{neuroLift_daily_cal:'120'}});
 await sync.syncNow();
 expect(sync.syncState().status).toBe('conflict'); expect(api).toHaveBeenCalledTimes(1);
 expect(readWorkspace().data.neuroLift_daily_cal).toBe('100');
 await sync.syncNow('remote');
 expect(readWorkspace().data.neuroLift_daily_cal).toBe('120');
 expect(localStorage.getItem('neuroLift_conflict_backup_1')).toContain('100');
});
test('edits made during upload remain dirty', async () => {
 writeWorkspace({version:0,data:{neuroLift_daily_cal:'100'},dirty:true});
 vi.mocked(api).mockResolvedValueOnce({version:0,data:{}}).mockImplementationOnce(async () => {
  safeStorage.setItem('neuroLift_daily_cal','200'); return {version:1,data:{neuroLift_daily_cal:'100'}} as never;
 });
 vi.useFakeTimers();
 try { await sync.syncNow(); expect(readWorkspace()).toEqual({version:1,data:{neuroLift_daily_cal:'200'},dirty:true}); }
 finally {vi.clearAllTimers(); vi.useRealTimers();}
});
test('late responses cannot modify a newly selected account', async () => {
 vi.mocked(api).mockImplementationOnce(async () => {changeScope('2'); return {version:2,data:{neuroLift_daily_cal:'100'}} as never;});
 await sync.syncNow(); expect(readWorkspace().data).toEqual({});
});
