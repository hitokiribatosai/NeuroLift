import { beforeEach, expect, test, vi } from 'vitest';
import { changeScope, readWorkspace, writeWorkspace, scope } from '../../utils/workspace';
import { safeStorage } from '../../utils/storage';
import { validateBackup } from '../../utils/validateBackup';
import { DataManager } from '../../utils/dataManager';
beforeEach(() => { localStorage.clear(); changeScope('guest'); });
test('accounts and guest have separate canonical collections', async () => {
 await safeStorage.saveTemplate('t', {id:'t', name:'Guest', exercises:[], createdAt:'2026-01-01'});
 changeScope('1'); expect(await safeStorage.getTemplates()).toEqual([]);
 await safeStorage.saveTemplate('t', {id:'t', name:'Member', exercises:[], createdAt:'2026-01-01'});
 changeScope('guest'); expect((await safeStorage.getTemplates())[0].name).toBe('Guest');
});
test('another tab switching account cannot redirect writes', () => {
 changeScope('1'); localStorage.setItem('neuroLift_active_owner','2');
 safeStorage.setItem('neuroLift_daily_cal','123');
 expect(scope()).toBe('1'); expect(localStorage.getItem('neuroLift_workspace_2')).toBeNull();
});
test('upsert does not duplicate a workout or template', async () => {
 const t = {id:'t', name:'A', exercises:[], createdAt:'2026-01-01'};
 await safeStorage.saveTemplate('t',t); await safeStorage.saveTemplate('t',{...t,name:'B'});
 expect(await safeStorage.getTemplates()).toHaveLength(1);
 expect((await safeStorage.getTemplates())[0].name).toBe('B');
 expect(readWorkspace().dirty).toBe(true);
});
test('quota failure propagates and preserves last saved state', () => {
 writeWorkspace({data:{},version:0,dirty:false});
 vi.spyOn(Storage.prototype,'setItem').mockImplementation(() => { throw new Error('quota'); });
 expect(() => safeStorage.setItem('neuroLift_daily_cal','100')).toThrow('Unable to save');
 expect(readWorkspace().data).toEqual({});
});
test('backup rejects unknown keys, invalid collections and negative calories', () => {
 for (const data of [{password:'secret'}, {neuroLift_history:[1]}, {neuroLift_daily_cal:-1}])
  expect(() => validateBackup({version:1,data})).toThrow();
});
test('backup round trips scalar values and structured templates', () => {
 expect(validateBackup({version:1,data:{neuroLift_daily_cal:0,neuroLift_hasCompletedOnboarding:true,neuroLift_templates:[]}}))
 .toEqual({neuroLift_daily_cal:'0',neuroLift_hasCompletedOnboarding:'true',neuroLift_templates:'[]'});
});
test('invalid restore is all-or-nothing', async () => {
 safeStorage.setItem('neuroLift_daily_cal','100');
 const before = readWorkspace();
 vi.spyOn(console,'error').mockImplementation(() => {});
 const result = await DataManager.importData(JSON.stringify({version:1,data:{neuroLift_daily_cal:200,neuroLift_history:[1]}}));
 expect(result.success).toBe(false); expect(readWorkspace()).toEqual(before);
});
