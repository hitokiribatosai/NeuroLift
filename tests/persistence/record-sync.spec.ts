import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => { await page.goto('/tests/persistence/blank.html'); });

test('conflict comparison fits a phone and shows both versions including deletion', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.evaluate(async () => {
    const path = '/tests/persistence/recoveryHarness.tsx';
    const { showRecordConflicts } = await import(path) as typeof import('./recoveryHarness');
    showRecordConflicts([{ desired: { kind: 'templates', id: 'routine-with-a-long-id-that-must-wrap-on-a-phone', deleted: false,
      value: { name: 'Sunday chest and shoulders', exercises: [] } },
    conflict: { kind: 'templates', id: 'routine-with-a-long-id-that-must-wrap-on-a-phone', deleted: true, value: null, revision: 3, sequence: 5 } }]);
  });
  const region = page.getByRole('region', { name: 'Review conflicting changes' });
  await expect(region).toBeVisible();
  await page.getByText('Compare both versions', { exact: true }).click();
  await expect(region.locator('pre').first()).toContainText('Sunday chest and shoulders');
  await expect(region.locator('pre').last()).toHaveText('Deleted');
  const box = await region.boundingBox();
  expect(box!.x + box!.width).toBeLessThanOrEqual(390);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
});

test('outbox commits with edits, survives reload, freezes retries and queues later edits', async ({ page }) => {
  const result = await page.evaluate(async () => {
    const path = '/utils/persistence/trainingDatabase.ts';
    const { openTrainingDatabase } = await import(path) as typeof import('../../utils/persistence/trainingDatabase');
    let db = await openTrainingDatabase();
    const original = { data: { neuroLift_units: 'kg' }, version: 1, dirty: false };
    await db.activate('1', original);
    const remote = { kind: 'settings' as const, id: 'neuroLift_units', value: 'kg', deleted: false, revision: 1, sequence: 1 };
    await db.attachRecordSync('1', [remote], 1, (await db.read('1'))!.metadata.generation);
    await db.patchWorkspace('1', original, { ...original, data: { neuroLift_units: 'lbs' }, dirty: true });
    const first = (await db.prepareOperation('1'))!;
    const before = db.workspaceFrom((await db.read('1'))!);
    await db.patchWorkspace('1', before, { ...before, data: { ...before.data, neuroLift_units: 'kg' } });
    db.close(); db = await openTrainingDatabase();
    const retry = await db.prepareOperation('1');
    await db.acknowledgeOperation('1', first, { ...remote, value: 'lbs', revision: 2, sequence: 3 });
    const cursorAfterReceipt = (await db.read('1'))!.metadata.recordSync!.cursor;
    const next = await db.prepareOperation('1');
    const otherAccount = await db.read('2');
    db.close();
    return { first, retry, next, cursorAfterReceipt, otherAccount };
  });
  expect(result.retry).toEqual(result.first);
  expect(result.first.value).toBe('lbs');
  expect(result.next!.value).toBe('kg');
  expect(result.next!.baseRevision).toBe(2);
  expect(result.next!.operationId).not.toBe(result.first.operationId);
  expect(result.cursorAfterReceipt).toBe(1);
  expect(result.otherAccount).toBeNull();
});

for (const choice of ['local', 'remote'] as const) {
  test(`same-record conflict keeps both copies and supports explicit ${choice} resolution`, async ({ page }) => {
    const result = await page.evaluate(async choice => {
      const path = '/utils/persistence/trainingDatabase.ts';
      const { openTrainingDatabase } = await import(path) as typeof import('../../utils/persistence/trainingDatabase');
      const db = await openTrainingDatabase();
      const original = { data: { neuroLift_userGoal: 'strength' }, version: 0, dirty: false };
      await db.activate('1', original);
      const remote = { kind: 'settings' as const, id: 'neuroLift_userGoal', value: 'strength', deleted: false, revision: 1, sequence: 1 };
      await db.attachRecordSync('1', [remote], 1, (await db.read('1'))!.metadata.generation);
      await db.patchWorkspace('1', original, { ...original, data: { neuroLift_userGoal: 'hypertrophy' }, dirty: true });
      const operation = (await db.prepareOperation('1'))!;
      await db.rejectRecordOperation('1', operation, { ...remote, value: 'endurance', revision: 2, sequence: 2 });
      const blocked = await db.prepareOperation('1');
      const conflicted = (await db.read('1'))!;
      await db.resolveRecordConflict('1', 'settings', remote.id, choice, 2);
      const resolved = (await db.read('1'))!;
      const next = await db.prepareOperation('1');
      db.close();
      return { blocked, conflicted, resolved, next };
    }, choice);
    expect(result.blocked).toBeNull();
    const conflict = Object.values(result.conflicted.metadata.recordSync!.pending)[0];
    expect(conflict.desired.value).toBe('hypertrophy');
    expect(conflict.conflict!.value).toBe('endurance');
    expect(result.resolved.metadata.recordSync!.resolutions).toHaveLength(1);
    expect(result.resolved.metadata.settings.neuroLift_userGoal).toBe(choice === 'local' ? 'hypertrophy' : 'endurance');
    if (choice === 'local') expect(result.next!.baseRevision).toBe(2);
    else expect(result.next).toBeNull();
  });
}

test('pull merges unrelated records, applies tombstones and commits cursor with data', async ({ page }) => {
  const result = await page.evaluate(async () => {
    const path = '/utils/persistence/trainingDatabase.ts';
    const { openTrainingDatabase } = await import(path) as typeof import('../../utils/persistence/trainingDatabase');
    const db = await openTrainingDatabase();
    const original = { data: { neuroLift_units: 'kg', neuroLift_userGoal: 'strength' }, version: 0, dirty: false };
    await db.activate('1', original);
    const units = { kind: 'settings' as const, id: 'neuroLift_units', value: 'kg', deleted: false, revision: 1, sequence: 1 };
    const goal = { ...units, id: 'neuroLift_userGoal', value: 'strength', sequence: 2 };
    await db.attachRecordSync('1', [units, goal], 2, (await db.read('1'))!.metadata.generation);
    await db.patchWorkspace('1', original, { ...original, data: { ...original.data, neuroLift_units: 'lbs' }, dirty: true });
    await db.applyRecordPage('1', [{ ...goal, deleted: true, value: null, revision: 2, sequence: 3 }], 3);
    const snapshot = (await db.read('1'))!;
    db.close(); return snapshot;
  });
  expect(result.metadata.settings.neuroLift_units).toBe('lbs');
  expect(result.metadata.settings.neuroLift_userGoal).toBeUndefined();
  expect(result.metadata.recordSync!.cursor).toBe(3);
  expect(Object.values(result.metadata.recordSync!.pending)).toHaveLength(1);
});

test('failed outbox or pull transaction cannot partially save data or cursor', async ({ page }) => {
  const result = await page.evaluate(async () => {
    const path = '/utils/persistence/trainingDatabase.ts';
    const { openTrainingDatabase } = await import(path) as typeof import('../../utils/persistence/trainingDatabase');
    const db = await openTrainingDatabase();
    const original = { data: { neuroLift_units: 'kg' }, version: 0, dirty: false };
    await db.activate('1', original);
    const units = { kind: 'settings' as const, id: 'neuroLift_units', value: 'kg', deleted: false, revision: 1, sequence: 1 };
    await db.attachRecordSync('1', [units], 1, (await db.read('1'))!.metadata.generation);
    const before = await db.read('1');
    const put = IDBObjectStore.prototype.put;
    IDBObjectStore.prototype.put = function (...args: Parameters<typeof put>) {
      if (this.name === 'metadata') throw new Error('Injected quota failure');
      return put.apply(this, args);
    };
    let failures = 0;
    try { await db.patchWorkspace('1', original, { ...original, data: { neuroLift_units: 'lbs' }, dirty: true }); } catch { failures++; }
    try { await db.applyRecordPage('1', [{ ...units, value: 'lbs', revision: 2, sequence: 2 }], 2); } catch { failures++; }
    IDBObjectStore.prototype.put = put;
    const after = await db.read('1');
    db.close(); return { before, after, failures };
  });
  expect(result.failures).toBe(2);
  expect(result.after).toEqual(result.before);
});

test('account sync retries a lost upload with the same operation ID and never calls snapshots', async ({ page }) => {
  const operations: { operationId: string; value: string }[] = [];
  let accepted = false;
  const calls: string[] = [];
  await page.route('**/api/**', async route => {
    const url = new URL(route.request().url());
    calls.push(url.pathname);
    if (url.pathname.endsWith('/auth/login/')) return route.fulfill({ json: { user: { id: '1', email: 'test@example.test', emailVerified: true }, token: 'synthetic-test-token' } });
    if (url.pathname.endsWith('/records/changes/')) return route.fulfill({ json: { records: [], cursor: accepted ? 2 : 1, hasMore: false } });
    if (url.pathname.endsWith('/records/operation/')) {
      const operation = route.request().postDataJSON(); operations.push(operation);
      if (operations.length === 1) return route.fulfill({ status: 503, json: { error: 'Injected lost response' } });
      accepted = true;
      return route.fulfill({ json: { record: { kind: operation.kind, id: operation.id, value: operation.value,
        deleted: false, revision: 2, sequence: 2 }, cursor: 2 } });
    }
    return route.fulfill({ status: 500, json: { error: 'Unexpected endpoint' } });
  });
  const first = await page.evaluate(async () => {
    const workspacePath = '/utils/workspace.ts', authPath = '/utils/authService.ts', syncPath = '/utils/sync.ts';
    const workspace = await import(workspacePath) as typeof import('../../utils/workspace');
    const { authService } = await import(authPath) as typeof import('../../utils/authService');
    const sync = await import(syncPath) as typeof import('../../utils/sync');
    const original = { data: { neuroLift_units: 'kg' }, version: 0, dirty: false };
    localStorage.setItem('neuroLift_workspace_1', JSON.stringify(original));
    await workspace.initializeWorkspace();
    await authService.signIn('test@example.test', 'synthetic-password');
    const snapshot = (await workspace.recordSyncSnapshot())!;
    await workspace.recordSyncCommand('1', db => db.attachRecordSync('1', [{ kind: 'settings', id: 'neuroLift_units', value: 'kg',
      deleted: false, revision: 1, sequence: 1 }], 1, snapshot.metadata.generation));
    await workspace.writeWorkspace({ ...original, data: { neuroLift_units: 'lbs' }, dirty: true });
    await sync.syncNow();
    return { status: sync.syncState().status, snapshot: await workspace.recordSyncSnapshot() };
  });
  expect(first.status).toBe('error');
  expect(Object.values(first.snapshot!.metadata.recordSync!.pending)).toHaveLength(1);
  const final = await page.evaluate(async () => {
    const syncPath = '/utils/sync.ts', workspacePath = '/utils/workspace.ts';
    const sync = await import(syncPath) as typeof import('../../utils/sync');
    const workspace = await import(workspacePath) as typeof import('../../utils/workspace');
    await sync.syncNow();
    return { status: sync.syncState().status, workspace: workspace.readWorkspace() };
  });
  expect(final.status).toBe('saved');
  expect(final.workspace.dirty).toBe(false);
  expect(final.workspace.data.neuroLift_units).toBe('lbs');
  expect(operations).toHaveLength(2);
  expect(operations[0]).toEqual(operations[1]);
  expect(calls.some(path => path.includes('snapshot'))).toBe(false);
});
