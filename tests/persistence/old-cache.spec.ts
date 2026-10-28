import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => { await page.goto('/tests/persistence/blank.html'); });

test('clean account upgrade requires export and explicit consent', async ({ page }) => {
  let migrations = 0;
  await page.route('**/api/**', async route => {
    const path = new URL(route.request().url()).pathname;
    if (path.endsWith('/auth/login/')) return route.fulfill({ json: {
      user: { id: '1', email: 'upgrade@example.test', emailVerified: true }, token: 'synthetic-token' } });
    if (path.endsWith('/snapshot/')) return route.fulfill({ json: { version: 0, data: {} } });
    if (path.endsWith('/records/migrate/')) {
      migrations++;
      expect(route.request().postDataJSON()).toEqual({ version: 0 });
      return route.fulfill({ json: { protocol: 2, cursor: 0 } });
    }
    if (path.endsWith('/records/changes/')) return route.fulfill({ json: { records: [], cursor: 0, hasMore: false } });
    return route.fulfill({ status: 500, json: { error: 'Unexpected endpoint' } });
  });
  await page.evaluate(async () => {
    const wp = '/utils/workspace.ts', ap = '/utils/authService.ts', hp = '/tests/persistence/recoveryHarness.tsx';
    const workspace = await import(wp) as typeof import('../../utils/workspace');
    const { authService } = await import(ap) as typeof import('../../utils/authService');
    await workspace.initializeWorkspace(); await authService.signIn('upgrade@example.test', 'synthetic-password');
    const { showAccount } = await import(hp) as typeof import('./recoveryHarness'); showAccount();
  });
  const upgrade = page.getByRole('button', { name: 'Upgrade this account', exact: true });
  await expect(upgrade).toBeDisabled(); expect(migrations).toBe(0);
  const downloading = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export recovery copy', exact: true }).click();
  await downloading; await expect(upgrade).toBeEnabled(); await upgrade.click();
  await expect.poll(() => page.evaluate(async () => {
    const wp = '/utils/workspace.ts';
    const workspace = await import(wp) as typeof import('../../utils/workspace');
    return !!(await workspace.recordSyncSnapshot())?.metadata.recordSync;
  })).toBe(true);
  expect(migrations).toBe(1);
  await expect(upgrade).toHaveCount(0);
});

test('account recovery requires export and offers per-record comparison without migrating the server', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const requests: string[] = [];
  await page.route('**/api/**', async route => {
    const url = new URL(route.request().url()); requests.push(route.request().method() + ' ' + url.pathname);
    if (url.pathname.endsWith('/auth/login/')) return route.fulfill({ json: {
      user: { id: '1', email: 'recovery@example.test', emailVerified: true }, token: 'synthetic-token' } });
    if (url.pathname.endsWith('/snapshot/')) return route.fulfill({ status: 426, json: { error: 'Record client required' } });
    if (url.pathname.endsWith('/records/changes/')) return route.fulfill({ json: {
      records: url.searchParams.get('cursor') === '0' ? [{ kind: 'settings', id: 'neuroLift_units', value: 'kg', deleted: false, revision: 2, sequence: 1 }] : [],
      cursor: 1, hasMore: false } });
    return route.fulfill({ status: 500, json: { error: 'Unexpected endpoint' } });
  });
  await page.evaluate(async () => {
    const wp = '/utils/workspace.ts', ap = '/utils/authService.ts', hp = '/tests/persistence/recoveryHarness.tsx';
    const workspace = await import(wp) as typeof import('../../utils/workspace');
    const { authService } = await import(ap) as typeof import('../../utils/authService');
    localStorage.setItem('neuroLift_workspace_1', JSON.stringify({ data: { neuroLift_units: 'lbs' }, version: 4, dirty: true }));
    await workspace.initializeWorkspace(); await authService.signIn('recovery@example.test', 'synthetic-password');
    const { showAccount } = await import(hp) as typeof import('./recoveryHarness'); showAccount();
  });
  const recover = page.getByRole('button', { name: 'Compare and reconnect', exact: true });
  await expect(recover).toBeDisabled();
  const downloading = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export recovery copy', exact: true }).click();
  const download = await downloading;
  const chunks: Buffer[] = [];
  for await (const chunk of (await download.createReadStream())!) chunks.push(chunk);
  expect(JSON.parse(Buffer.concat(chunks).toString()).durable.metadata.settings.neuroLift_units).toBe('lbs');
  await expect(recover).toBeEnabled(); await recover.click();
  await expect(page.getByRole('heading', { name: 'Review conflicting changes' })).toBeVisible();
  await page.getByText('Compare both versions', { exact: true }).click();
  await expect(page.locator('pre').first()).toContainText('lbs');
  await expect(page.locator('pre').last()).toContainText('kg');
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  expect(requests.some(request => request.includes('/migrate/') || request.startsWith('PUT') || request.includes('/operation/'))).toBe(false);
});

test('explicit old-cache recovery archives the original and never resurrects server deletions silently', async ({ page }) => {
  const result = await page.evaluate(async () => {
    const path = '/utils/persistence/trainingDatabase.ts';
    const { openTrainingDatabase } = await import(path) as typeof import('../../utils/persistence/trainingDatabase');
    let db = await openTrainingDatabase();
    const original = { data: { neuroLift_units: 'lbs', neuroLift_userGoal: 'strength' }, version: 4, dirty: true };
    await db.activate('1', original);
    const generation = (await db.read('1'))!.metadata.generation;
    await db.beginRecordEnrollment('1', 4, 'recover', generation);
    await db.saveEnrollmentPage('1', [
      { kind: 'settings', id: 'neuroLift_units', deleted: false, value: 'kg', revision: 3, sequence: 1 },
      { kind: 'settings', id: 'neuroLift_userGoal', deleted: true, value: null, revision: 2, sequence: 2 },
      { kind: 'settings', id: 'neuroLift_daily_cal', deleted: false, value: '100', revision: 1, sequence: 3 },
    ], 3, false, 0);
    db.close(); db = await openTrainingDatabase();
    await db.finalizeRecordEnrollment('1');
    const snapshot = (await db.read('1'))!;
    const automaticOperation = await db.prepareOperation('1');
    const archives = await db.recoveryCopies('1');
    await db.resolveRecordConflict('1', 'settings', 'neuroLift_userGoal', 'remote', 2);
    const resolved = db.workspaceFrom((await db.read('1'))!);
    db.close(); return { snapshot, automaticOperation, archives, resolved };
  });
  expect(result.archives).toHaveLength(1);
  expect(result.archives[0].legacy.data.neuroLift_units).toBe('lbs');
  expect(result.snapshot.metadata.enrollment).toBeUndefined();
  expect(Object.values(result.snapshot.metadata.recordSync!.pending)).toHaveLength(2);
  expect(Object.values(result.snapshot.metadata.recordSync!.pending).every(row => !!row.conflict)).toBe(true);
  expect(result.automaticOperation).toBeNull();
  expect(result.resolved.data.neuroLift_userGoal).toBeUndefined();
  expect(result.resolved.data.neuroLift_daily_cal).toBe('100');
});

test('stale export and failed archive cannot start or partially change account recovery', async ({ page }) => {
  const result = await page.evaluate(async () => {
    const path = '/utils/persistence/trainingDatabase.ts';
    const { openTrainingDatabase } = await import(path) as typeof import('../../utils/persistence/trainingDatabase');
    const db = await openTrainingDatabase();
    const original = { data: { neuroLift_units: 'kg' }, version: 4, dirty: true };
    await db.activate('1', original);
    const before = (await db.read('1'))!;
    let stale = false, failed = false;
    try { await db.beginRecordEnrollment('1', 4, 'recover', before.metadata.generation - 1); } catch { stale = true; }
    const add = IDBObjectStore.prototype.add;
    IDBObjectStore.prototype.add = function (...args: Parameters<typeof add>) {
      if (this.name === 'recovery') throw new Error('Injected archive failure');
      return add.apply(this, args);
    };
    try { await db.beginRecordEnrollment('1', 4, 'recover', before.metadata.generation); } catch { failed = true; }
    finally { IDBObjectStore.prototype.add = add; }
    const after = await db.read('1'), archives = await db.recoveryCopies('1');
    db.close(); return { stale, failed, before, after, archives };
  });
  expect(result.stale).toBe(true);
  expect(result.failed).toBe(true);
  expect(result.after).toEqual(result.before);
  expect(result.archives).toEqual([]);
});
