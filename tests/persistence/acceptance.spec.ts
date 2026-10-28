import { expect, test } from '@playwright/test';
import source from '../fixtures/legacy-workspace.json' with { type: 'json' };

test.beforeEach(async ({ page }) => { await page.goto('/tests/persistence/blank.html'); });

test('journal input survives another tab update and refreshes only after leaving the editor', async ({ page }) => {
  await page.evaluate(async () => {
    localStorage.setItem('neuroLift_workspace_guest', JSON.stringify({ version: 0, dirty: false,
      data: { language: 'en', neuroLift_hasCompletedOnboarding: 'true', neuroLift_userGoal: 'strength' } }));
    window.location.hash = 'journal';
    const path = '/tests/persistence/appHarness.tsx';
    const { startMigratedApp } = await import(path) as typeof import('./appHarness'); await startMigratedApp();
  });
  await page.getByRole('button', { name: 'Body Metrics', exact: true }).click();
  const weight = page.getByLabel('Weight (kg)', { exact: true });
  await weight.fill('72');
  await page.evaluate(async () => {
    const dp = '/utils/persistence/trainingDatabase.ts', wp = '/utils/workspace.ts';
    const { openTrainingDatabase } = await import(dp) as typeof import('../../utils/persistence/trainingDatabase');
    const { flushWorkspace } = await import(wp) as typeof import('../../utils/workspace');
    await flushWorkspace();
    const db = await openTrainingDatabase();
    const previous = db.workspaceFrom((await db.read('guest'))!);
    await db.patchWorkspace('guest', previous, { ...previous, data: { ...previous.data, neuroLift_daily_cal: '123' }, dirty: true });
    db.close();
    const channel = new BroadcastChannel('neurolift-training-changes'); channel.postMessage('guest'); channel.close();
  });
  await expect(weight).toHaveValue('72');
  await expect.poll(() => page.evaluate(async () => {
    const wp = '/utils/workspace.ts';
    const workspace = await import(wp) as typeof import('../../utils/workspace');
    return workspace.workspaceEditing();
  })).toBe(true);
  await page.evaluate(() => { window.location.hash = 'home'; });
  await expect.poll(() => page.evaluate(async () => {
    const wp = '/utils/workspace.ts';
    const workspace = await import(wp) as typeof import('../../utils/workspace');
    return workspace.readWorkspace().data.neuroLift_daily_cal;
  })).toBe('123');
});

test('canonical backup exports and restores normalized training data without changing original legacy source', async ({ page }) => {
  await page.evaluate(async source => {
    localStorage.setItem('neuroLift_workspace_guest', JSON.stringify(source));
    const wp = '/utils/workspace.ts';
    const workspace = await import(wp) as typeof import('../../utils/workspace'); await workspace.initializeWorkspace();
  }, source);
  const downloading = page.waitForEvent('download');
  expect(await page.evaluate(async () => {
    const path = '/utils/dataManager.ts';
    const { DataManager } = await import(path) as typeof import('../../utils/dataManager'); return DataManager.exportData();
  })).toBe(true);
  const chunks: Buffer[] = [];
  for await (const chunk of (await (await downloading).createReadStream())!) chunks.push(chunk);
  const backup = Buffer.concat(chunks).toString();
  const result = await page.evaluate(async backup => {
    const wp = '/utils/workspace.ts', dp = '/utils/dataManager.ts';
    const workspace = await import(wp) as typeof import('../../utils/workspace');
    const { DataManager } = await import(dp) as typeof import('../../utils/dataManager');
    const before = workspace.readWorkspace();
    await workspace.writeWorkspace({ ...before, data: { ...before.data, neuroLift_history: '[]', neuroLift_templates: '[]', neuroLift_weekly_schedule: '{}' }, dirty: true });
    const restored = await DataManager.importData(backup);
    return { restored, before, after: workspace.readWorkspace(), legacy: localStorage.getItem('neuroLift_workspace_guest') };
  }, backup);
  expect(result.restored.success).toBe(true);
  expect(result.after.data).toEqual(result.before.data);
  expect(result.legacy).toBe(JSON.stringify(source));
});

test('failed backup restore reports failure and leaves durable data unchanged', async ({ page }) => {
  const result = await page.evaluate(async () => {
    const wp = '/utils/workspace.ts', dp = '/utils/dataManager.ts', tp = '/utils/persistence/trainingDatabase.ts';
    const workspace = await import(wp) as typeof import('../../utils/workspace');
    const { DataManager } = await import(dp) as typeof import('../../utils/dataManager');
    const { openTrainingDatabase } = await import(tp) as typeof import('../../utils/persistence/trainingDatabase');
    await workspace.initializeWorkspace();
    const db = await openTrainingDatabase(), before = await db.read('guest');
    const put = IDBObjectStore.prototype.put;
    IDBObjectStore.prototype.put = function (...args: Parameters<typeof put>) {
      if (this.name === 'metadata') throw new Error('Injected restore failure');
      return put.apply(this, args);
    };
    let restored;
    try { restored = await DataManager.importData(JSON.stringify({ version: 1, data: { neuroLift_units: 'lbs' } })); }
    finally { IDBObjectStore.prototype.put = put; }
    const after = await db.read('guest'); db.close();
    return { before, after, restored };
  });
  expect(result.restored!.success).toBe(false);
  expect(result.after).toEqual(result.before);
});
