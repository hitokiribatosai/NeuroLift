import { expect, test, Page } from '@playwright/test';
import fixture from '../fixtures/legacy-workspace.json' with { type: 'json' };

async function signIn(page: Page, initialize = true) {
  await page.goto('/tests/persistence/blank.html');
  await page.evaluate(async initialize => {
    const wp = '/utils/workspace.ts', ap = '/utils/authService.ts';
    const workspace = await import(wp) as typeof import('../../utils/workspace');
    const { authService } = await import(ap) as typeof import('../../utils/authService');
    if (initialize) await workspace.initializeWorkspace();
    await authService.signIn('fresh@example.test', 'synthetic-password');
  }, initialize);
}

test('fresh device resumes a partial join after reload without migrating or writing snapshots', async ({ page }) => {
  const requests: string[] = [];
  let interrupted = false;
  await page.route('**/api/**', async route => {
    const url = new URL(route.request().url());
    requests.push(route.request().method() + ' ' + url.pathname);
    if (url.pathname.endsWith('/auth/login/')) return route.fulfill({ json: {
      user: { id: '1', email: 'fresh@example.test', emailVerified: true }, token: 'synthetic-token' } });
    if (url.pathname.endsWith('/snapshot/')) return route.fulfill({ status: 426, json: { error: 'Record client required' } });
    if (url.pathname.endsWith('/records/changes/')) {
      const cursor = Number(url.searchParams.get('cursor'));
      if (cursor === 1 && !interrupted) {
        interrupted = true;
        return route.fulfill({ status: 503, json: { error: 'Interrupted download' } });
      }
      return route.fulfill({ json: cursor === 0 ? {
        records: [{ kind: 'settings', id: 'neuroLift_units', value: 'kg', deleted: false, revision: 1, sequence: 1 }], cursor: 1, hasMore: true,
      } : { records: cursor === 1 ? [{ kind: 'settings', id: 'neuroLift_userGoal', value: 'strength', deleted: false, revision: 1, sequence: 2 }] : [],
        cursor: 2, hasMore: false } });
    }
    return route.fulfill({ status: 500, json: { error: 'Unexpected request' } });
  });
  await signIn(page);
  const checkpoint = await page.evaluate(async () => {
    const wp = '/utils/workspace.ts', sp = '/utils/sync.ts';
    const workspace = await import(wp) as typeof import('../../utils/workspace');
    const sync = await import(sp) as typeof import('../../utils/sync');
    await sync.syncNow();
    // This edit happens after the join checkpoint. It must survive the restart
    // and become a conflict, never silently disappear under the server copy.
    const current = workspace.readWorkspace();
    await workspace.writeWorkspace({ ...current, dirty: true, data: { ...current.data,
      neuroLift_units: 'lbs', neuroLift_tracker_phase: 'setup' } });
    return { snapshot: await workspace.recordSyncSnapshot(), status: sync.syncState().status };
  });
  expect(checkpoint.status).toBe('error');
  expect(checkpoint.snapshot!.metadata.enrollment!.mode).toBe('join');
  expect(checkpoint.snapshot!.metadata.enrollment!.pulled.cursor).toBe(1);
  expect(checkpoint.snapshot!.metadata.recordSync).toBeUndefined();
  await signIn(page);
  const result = await page.evaluate(async () => {
    const wp = '/utils/workspace.ts', sp = '/utils/sync.ts';
    const workspace = await import(wp) as typeof import('../../utils/workspace');
    const sync = await import(sp) as typeof import('../../utils/sync');
    await sync.syncNow();
    return { state: sync.syncState(), snapshot: await workspace.recordSyncSnapshot(), workspace: workspace.readWorkspace() };
  });
  expect(result.snapshot!.metadata.enrollment).toBeUndefined();
  expect(result.snapshot!.metadata.recordSync!.cursor).toBe(2);
  expect(result.workspace.data.neuroLift_units).toBe('lbs');
  expect(result.workspace.data.neuroLift_userGoal).toBe('strength');
  expect(result.workspace.data.neuroLift_tracker_phase).toBe('setup');
  expect(result.state.status).toBe('conflict');
  expect(result.state.recordConflicts[0].conflict!.value).toBe('kg');
  expect(requests.filter(request => request.includes('/snapshot/'))).toEqual(['GET /api/snapshot/']);
  expect(requests.some(request => request.includes('/migrate/') || request.includes('/operation/'))).toBe(false);
});

test('joining refuses existing caches, dirty data and guest ownership without changing them', async ({ page }) => {
  await page.goto('/tests/persistence/blank.html');
  const results = await page.evaluate(async () => {
    const path = '/utils/persistence/trainingDatabase.ts';
    const { openTrainingDatabase } = await import(path) as typeof import('../../utils/persistence/trainingDatabase');
    const db = await openTrainingDatabase();
    const results = [];
    for (const [owner, source] of [
      ['1', { data: { neuroLift_units: 'kg' }, version: 0, dirty: false }],
      ['2', { data: {}, version: 3, dirty: false }],
      ['3', { data: {}, version: 0, dirty: true }],
      ['guest', { data: {}, version: 0, dirty: false }],
    ] as const) {
      await db.activate(owner, source);
      const before = await db.read(owner);
      let rejected = false;
      try { await db.beginRecordEnrollment(owner, 0, 'join'); } catch { rejected = true; }
      results.push({ rejected, before, after: await db.read(owner) });
    }
    db.close(); return results;
  });
  for (const result of results) {
    expect(result.rejected).toBe(true);
    expect(result.after).toEqual(result.before);
  }
});

test('clean join restores training collections, retains guest isolation and survives reopening', async ({ page }) => {
  const requests: string[] = [];
  const workout = JSON.parse(fixture.data.neuroLift_history)[0];
  const template = JSON.parse(fixture.data.neuroLift_templates)[0];
  const records = [
    { kind: 'workouts', id: workout.id, value: workout, revision: 1, sequence: 1, deleted: false },
    { kind: 'templates', id: template.id, value: template, revision: 1, sequence: 2, deleted: false },
    { kind: 'schedule', id: '0', value: template.id, revision: 1, sequence: 3, deleted: false },
  ];
  await page.route('**/api/**', async route => {
    const url = new URL(route.request().url());
    requests.push(route.request().method() + ' ' + url.pathname);
    if (url.pathname.endsWith('/auth/login/')) return route.fulfill({ json: {
      user: { id: '1', email: 'fresh@example.test', emailVerified: true }, token: 'synthetic-token' } });
    if (url.pathname.endsWith('/snapshot/')) return route.fulfill({ status: 426, json: { error: 'Record client required' } });
    if (url.pathname.endsWith('/records/changes/')) return route.fulfill({ json: {
      records: url.searchParams.get('cursor') === '0' ? records : [], cursor: 3, hasMore: false } });
    return route.fulfill({ status: 500, json: { error: 'Unexpected request' } });
  });
  await page.goto('/tests/persistence/blank.html');
  await page.evaluate(fixture => localStorage.setItem('neuroLift_workspace_guest', JSON.stringify(fixture)), fixture);
  await signIn(page);
  const state = await page.evaluate(async () => {
    const sp = '/utils/sync.ts';
    const sync = await import(sp) as typeof import('../../utils/sync');
    await sync.syncNow(); return sync.syncState();
  });
  expect(state.status).toBe('saved');
  await signIn(page);
  const result = await page.evaluate(async () => {
    const wp = '/utils/workspace.ts', dp = '/utils/persistence/trainingDatabase.ts';
    const workspace = await import(wp) as typeof import('../../utils/workspace');
    const { openTrainingDatabase } = await import(dp) as typeof import('../../utils/persistence/trainingDatabase');
    const db = await openTrainingDatabase();
    const guest = db.workspaceFrom((await db.read('guest'))!); db.close();
    return { account: workspace.readWorkspace(), guest, snapshot: await workspace.recordSyncSnapshot() };
  });
  expect(JSON.parse(result.account.data.neuroLift_history)[0]).toMatchObject(workout);
  expect(JSON.parse(result.account.data.neuroLift_templates)[0]).toMatchObject(template);
  expect(JSON.parse(result.account.data.neuroLift_weekly_schedule)).toEqual({ '0': template.id });
  expect(result.account.data.neuroLift_tracker_active_exercises).toBeUndefined();
  expect(result.guest.data.neuroLift_tracker_active_exercises).toBeTruthy();
  expect(result.account.dirty).toBe(false);
  expect(result.snapshot!.metadata.recordSync!.pending).toEqual({});
  expect(requests.some(request => request.startsWith('PUT') || request.includes('/migrate/') || request.includes('/operation/'))).toBe(false);
});

test('production legacy storage never joins or sends a snapshot after a server upgrade rejection', async ({ page }) => {
  const requests: string[] = [];
  await page.route('**/api/**', async route => {
    const path = new URL(route.request().url()).pathname;
    requests.push(route.request().method() + ' ' + path);
    if (path.endsWith('/auth/login/')) return route.fulfill({ json: {
      user: { id: '1', email: 'fresh@example.test', emailVerified: true }, token: 'synthetic-token' } });
    return route.fulfill({ status: 426, json: { error: 'Record client required' } });
  });
  await signIn(page, false);
  const result = await page.evaluate(async () => {
    const wp = '/utils/workspace.ts', sp = '/utils/sync.ts';
    const workspace = await import(wp) as typeof import('../../utils/workspace');
    const sync = await import(sp) as typeof import('../../utils/sync');
    await sync.syncNow();
    return { state: sync.syncState(), snapshot: await workspace.recordSyncSnapshot() };
  });
  expect(result.state.status).toBe('error');
  expect(result.snapshot).toBeNull();
  expect(requests).toEqual(['POST /api/auth/login/', 'GET /api/snapshot/']);
});
