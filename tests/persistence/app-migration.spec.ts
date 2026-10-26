import { expect, test } from '@playwright/test';
import source from '../fixtures/legacy-workspace.json' with { type: 'json' };

const fixture = { ...source, data: { ...source.data, language: 'en', neuroLift_hasCompletedOnboarding: 'true', neuroLift_userGoal: 'strength' } };
async function start(page: import('@playwright/test').Page) {
  await page.evaluate(async () => {
    window.location.hash = 'tracker';
    const path = '/tests/persistence/appHarness.tsx';
    const { startMigratedApp } = await import(path) as typeof import('./appHarness');
    await startMigratedApp();
  });
}

test('whole migrated app edits, finishes, reloads and preserves legacy recovery source', async ({ page }) => {
  await page.goto('/tests/persistence/blank.html');
  await page.evaluate(fixture => localStorage.setItem('neuroLift_workspace_guest', JSON.stringify(fixture)), fixture);
  await start(page);
  await expect(page.getByLabel('KG — SET 1', { exact: true })).toHaveValue('55');
  await page.getByLabel('KG — SET 1', { exact: true }).fill('60');
  await expect.poll(() => page.evaluate(async () => {
    const path = '/utils/workspace.ts';
    const { readWorkspace } = await import(path) as typeof import('../../utils/workspace');
    return JSON.parse(readWorkspace().data.neuroLift_tracker_active_exercises)[0].sets[0].weight;
  })).toBe(60);
  await page.getByRole('button', { name: /Finish Workout/ }).click();
  await page.getByRole('button', { name: 'Finish Workout', exact: true }).click();
  await expect(page.getByRole('region', { name: 'Exercise breakdown' })).toContainText('600 kg');
  await page.evaluate(async () => {
    const path = '/utils/workspace.ts';
    const { flushWorkspace } = await import(path) as typeof import('../../utils/workspace');
    await flushWorkspace();
  });
  await page.reload(); await start(page);
  await expect(page.getByRole('button', { name: /Select Exercises/ })).toBeVisible();
  const result = await page.evaluate(async () => {
    const path = '/utils/workspace.ts';
    const workspace = await import(path) as typeof import('../../utils/workspace');
    await workspace.flushWorkspace();
    return { state: workspace.readWorkspace(), legacy: localStorage.getItem('neuroLift_workspace_guest') };
  });
  expect(JSON.parse(result.state.data.neuroLift_history)).toHaveLength(2);
  expect(result.legacy).toBe(JSON.stringify(fixture));
});

test('corrupt startup shows recovery, exports raw source and does not open the workout', async ({ page }) => {
  await page.goto('/tests/persistence/blank.html');
  await page.evaluate(() => localStorage.setItem('neuroLift_workspace_guest', 'invalid-source'));
  await start(page);
  await expect(page.getByRole('heading', { name: 'Your saved data needs attention' })).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem('neuroLift_workspace_guest'))).toBe('invalid-source');
  const downloading = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export recovery copy' }).click();
  const download = await downloading;
  const chunks: Buffer[] = [];
  for await (const chunk of (await download.createReadStream())!) chunks.push(chunk);
  expect(JSON.parse(Buffer.concat(chunks).toString()).legacy).toBe('invalid-source');
  await expect(page.getByRole('button', { name: /Finish Workout/ })).toHaveCount(0);
});

test('changed source requires export and an explicit choice before app startup', async ({ page }) => {
  await page.goto('/tests/persistence/blank.html');
  await page.evaluate(async fixture => {
    const path = '/utils/persistence/trainingDatabase.ts';
    const { openTrainingDatabase } = await import(path) as typeof import('../../utils/persistence/trainingDatabase');
    const db = await openTrainingDatabase();
    await db.activate('guest', fixture);
    db.close();
    localStorage.setItem('neuroLift_workspace_guest', JSON.stringify({ ...fixture,
      data: { ...fixture.data, neuroLift_units: 'lbs' } }));
  }, fixture);
  await start(page);
  const choose = page.getByRole('button', { name: 'Open database copy', exact: true });
  await expect(choose).toBeDisabled();
  const downloading = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export recovery copy' }).click();
  await downloading;
  await expect(choose).toBeEnabled();
  await choose.click();
  await expect(page.getByLabel('KG — SET 1', { exact: true })).toHaveValue('55');
  const archives = await page.evaluate(async () => {
    const path = '/utils/workspace.ts';
    const { readRecoveryBundle } = await import(path) as typeof import('../../utils/workspace');
    return (await readRecoveryBundle()).previousRecoveries;
  });
  expect(archives).toHaveLength(1);
  expect(archives[0].legacy.data.neuroLift_units).toBe('lbs');
});
