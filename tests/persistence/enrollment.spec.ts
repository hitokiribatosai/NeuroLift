import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => { await page.goto('/tests/persistence/blank.html'); });

test('rejected enrollment can clear only its untouched checkpoint without losing edits', async ({ page }) => {
  const result = await page.evaluate(async () => {
    const path = '/utils/persistence/trainingDatabase.ts';
    const { openTrainingDatabase } = await import(path) as typeof import('../../utils/persistence/trainingDatabase');
    const db = await openTrainingDatabase();
    const source = { data: { neuroLift_units: 'kg' }, version: 4, dirty: false };
    await db.activate('1', source); await db.beginRecordEnrollment('1', 4);
    await db.patchWorkspace('1', source, { ...source, data: { neuroLift_units: 'lbs' }, dirty: true });
    await db.cancelRejectedEnrollment('1', 4);
    const cancelled = (await db.read('1'))!;
    const current = db.workspaceFrom(cancelled);
    await db.patchWorkspace('1', current, { ...current, dirty: false });
    await db.beginRecordEnrollment('1', 4);
    await db.saveEnrollmentPage('1', [], 0, false, 0);
    let blocked = false;
    try { await db.cancelRejectedEnrollment('1', 4); } catch { blocked = true; }
    db.close(); return { cancelled, blocked };
  });
  expect(result.cancelled.metadata.enrollment).toBeUndefined();
  expect(result.cancelled.metadata.settings.neuroLift_units).toBe('lbs');
  expect(result.cancelled.metadata.dirty).toBe(true);
  expect(result.blocked).toBe(true);
});

test('interrupted enrollment resumes pages and preserves later local edits and conflicts', async ({ page }) => {
  const result = await page.evaluate(async () => {
    const path = '/utils/persistence/trainingDatabase.ts';
    const { openTrainingDatabase } = await import(path) as typeof import('../../utils/persistence/trainingDatabase');
    let db = await openTrainingDatabase();
    const source = { data: { neuroLift_units: 'kg', neuroLift_userGoal: 'strength' }, version: 4, dirty: false };
    await db.activate('1', source);
    await db.beginRecordEnrollment('1', 4);
    await db.saveEnrollmentPage('1', [{ kind: 'settings', id: 'neuroLift_units', value: 'kg', deleted: false, revision: 1, sequence: 1 }], 1, true, 0);
    await db.patchWorkspace('1', source, { ...source, dirty: true,
      data: { neuroLift_units: 'lbs', neuroLift_userGoal: 'hypertrophy', neuroLift_tracker_phase: 'setup' } });
    db.close(); db = await openTrainingDatabase();
    const resumedCursor = (await db.read('1'))!.metadata.enrollment!.pulled.cursor;
    await db.beginRecordEnrollment('1', 4); // Idempotent; does not erase later edits.
    await db.saveEnrollmentPage('1', [{ kind: 'settings', id: 'neuroLift_userGoal', value: 'endurance', deleted: false, revision: 2, sequence: 3 }], 3, false, 1);
    await db.finalizeRecordEnrollment('1');
    const snapshot = (await db.read('1'))!;
    const workspace = db.workspaceFrom(snapshot);
    db.close(); return { resumedCursor, snapshot, workspace };
  });
  expect(result.resumedCursor).toBe(1);
  expect(result.snapshot.metadata.enrollment).toBeUndefined();
  expect(result.snapshot.metadata.recordSync!.cursor).toBe(3);
  expect(result.workspace.data.neuroLift_units).toBe('lbs');
  expect(result.workspace.data.neuroLift_userGoal).toBe('hypertrophy');
  expect(result.workspace.data.neuroLift_tracker_phase).toBe('setup');
  const pending = Object.values(result.snapshot.metadata.recordSync!.pending);
  expect(pending).toHaveLength(2);
  expect(pending.find(row => row.desired.id === 'neuroLift_units')!.conflict).toBeUndefined();
  expect(pending.find(row => row.desired.id === 'neuroLift_userGoal')!.conflict!.value).toBe('endurance');
});

test('dirty snapshots cannot enroll and failed finalization remains resumable', async ({ page }) => {
  const result = await page.evaluate(async () => {
    const path = '/utils/persistence/trainingDatabase.ts';
    const { openTrainingDatabase } = await import(path) as typeof import('../../utils/persistence/trainingDatabase');
    const db = await openTrainingDatabase();
    const source = { data: { neuroLift_units: 'kg' }, version: 2, dirty: true };
    await db.activate('1', source);
    let blocked = false;
    try { await db.beginRecordEnrollment('1', 2); } catch { blocked = true; }
    await db.patchWorkspace('1', source, { ...source, dirty: false });
    await db.beginRecordEnrollment('1', 2);
    let incompleteBlocked = false;
    try { await db.finalizeRecordEnrollment('1'); } catch { incompleteBlocked = true; }
    await db.saveEnrollmentPage('1', [{ kind: 'settings', id: 'neuroLift_units', value: 'kg', deleted: false, revision: 1, sequence: 1 }], 1, false, 0);
    const before = await db.read('1');
    const put = IDBObjectStore.prototype.put;
    IDBObjectStore.prototype.put = function (...args: Parameters<typeof put>) {
      if (this.name === 'metadata') throw new Error('Injected failure');
      return put.apply(this, args);
    };
    let failed = false;
    try { await db.finalizeRecordEnrollment('1'); } catch { failed = true; }
    finally { IDBObjectStore.prototype.put = put; }
    const after = await db.read('1');
    await db.finalizeRecordEnrollment('1');
    const final = await db.read('1');
    db.close(); return { blocked, incompleteBlocked, failed, before, after, final };
  });
  expect(result.blocked).toBe(true);
  expect(result.incompleteBlocked).toBe(true);
  expect(result.failed).toBe(true);
  expect(result.after).toEqual(result.before);
  expect(result.final!.metadata.recordSync!.cursor).toBe(1);
  expect(result.final!.metadata.enrollment).toBeUndefined();
});

test('lost server-migration response resumes through account sync without legacy requests', async ({ page }) => {
  let attempts = 0;
  const paths: string[] = [];
  await page.route('**/api/**', async route => {
    const url = new URL(route.request().url()); paths.push(url.pathname);
    if (url.pathname.endsWith('/auth/login/')) return route.fulfill({ json: { user: { id: '1', email: 'test@example.test', emailVerified: true }, token: 'synthetic-token' } });
    if (url.pathname.endsWith('/records/migrate/')) {
      attempts++;
      expect(route.request().postDataJSON()).toEqual({ version: 4 });
      return attempts === 1 ? route.fulfill({ status: 503, json: { error: 'Lost response' } }) : route.fulfill({ json: { protocol: 2, cursor: 1 } });
    }
    if (url.pathname.endsWith('/records/changes/')) return route.fulfill({ json: {
      records: url.searchParams.get('cursor') === '0' ? [{ kind: 'settings', id: 'neuroLift_units', value: 'kg', deleted: false, revision: 1, sequence: 1 }] : [],
      cursor: 1, hasMore: false } });
    return route.fulfill({ status: 500, json: { error: 'Unexpected endpoint' } });
  });
  const result = await page.evaluate(async () => {
    const wp = '/utils/workspace.ts', ap = '/utils/authService.ts', rp = '/utils/recordSync.ts', sp = '/utils/sync.ts';
    const workspace = await import(wp) as typeof import('../../utils/workspace');
    const { authService } = await import(ap) as typeof import('../../utils/authService');
    const { beginRecordSync } = await import(rp) as typeof import('../../utils/recordSync');
    const sync = await import(sp) as typeof import('../../utils/sync');
    localStorage.setItem('neuroLift_workspace_1', JSON.stringify({ data: { neuroLift_units: 'kg' }, version: 4, dirty: false }));
    await workspace.initializeWorkspace(); await authService.signIn('test@example.test', 'synthetic-password');
    let failed = false;
    try { await beginRecordSync('1', 4); } catch { failed = true; }
    const checkpoint = (await workspace.recordSyncSnapshot())!.metadata.enrollment;
    let snapshotBlocked = false;
    try { await workspace.applyRemote({}, 5); } catch { snapshotBlocked = true; }
    await sync.syncNow();
    return { failed, checkpoint, snapshotBlocked, status: sync.syncState().status, snapshot: await workspace.recordSyncSnapshot() };
  });
  expect(result.failed).toBe(true);
  expect(result.checkpoint!.baseline.version).toBe(4);
  expect(result.snapshotBlocked).toBe(true);
  expect(result.status).toBe('saved');
  expect(result.snapshot!.metadata.enrollment).toBeUndefined();
  expect(result.snapshot!.metadata.recordSync!.cursor).toBe(1);
  expect(attempts).toBe(2);
  expect(paths.some(path => path.includes('/snapshot'))).toBe(false);
});
