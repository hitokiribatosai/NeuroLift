import { expect, test, Page } from '@playwright/test';

async function prepare(page: Page) {
  await page.goto('/tests/persistence/blank.html');
  await page.evaluate(async () => {
    const wp = '/utils/workspace.ts', ap = '/utils/authService.ts';
    const workspace = await import(wp) as typeof import('../../utils/workspace');
    const { authService } = await import(ap) as typeof import('../../utils/authService');
    const original = { data: { neuroLift_units: 'kg' }, version: 0, dirty: false };
    localStorage.setItem('neuroLift_workspace_1', JSON.stringify(original));
    await workspace.initializeWorkspace();
    await authService.signIn('one@example.test', 'synthetic-password');
    const snapshot = (await workspace.recordSyncSnapshot())!;
    await workspace.recordSyncCommand('1', db => db.attachRecordSync('1', [{ kind: 'settings', id: 'neuroLift_units', value: 'kg',
      deleted: false, revision: 1, sequence: 1 }], 1, snapshot.metadata.generation));
    await workspace.writeWorkspace({ ...original, data: { neuroLift_units: 'lbs' }, dirty: true });
  });
}

test('expired authentication retains the immutable pending operation for sign-in retry', async ({ page }) => {
  await page.route('**/api/**', async route => {
    const path = new URL(route.request().url()).pathname;
    if (path.endsWith('/auth/login/')) return route.fulfill({ json: { user: { id: '1', email: 'one@example.test', emailVerified: true }, token: 'synthetic-token' } });
    if (path.endsWith('/records/changes/')) return route.fulfill({ json: { records: [], cursor: 1, hasMore: false } });
    return route.fulfill({ status: 401, json: { error: 'Expired session' } });
  });
  await prepare(page);
  const result = await page.evaluate(async () => {
    const sp = '/utils/sync.ts', wp = '/utils/workspace.ts', ap = '/utils/authService.ts';
    const sync = await import(sp) as typeof import('../../utils/sync');
    const workspace = await import(wp) as typeof import('../../utils/workspace');
    const auth = await import(ap) as typeof import('../../utils/authService');
    await sync.syncNow();
    return { signedIn: auth.signedIn(), workspace: workspace.readWorkspace(), state: await workspace.recordSyncSnapshot() };
  });
  expect(result.signedIn).toBe(false);
  expect(result.workspace.data.neuroLift_units).toBe('lbs');
  expect(result.workspace.dirty).toBe(true);
  expect(Object.values(result.state!.metadata.recordSync!.pending)[0].operation!.value).toBe('lbs');
});

test('an upload response arriving after account switch cannot acknowledge or modify the new account', async ({ page }) => {
  let requested!: () => void, release!: () => void;
  const uploadStarted = new Promise<void>(resolve => { requested = resolve; });
  const uploadRelease = new Promise<void>(resolve => { release = resolve; });
  await page.route('**/api/**', async route => {
    const path = new URL(route.request().url()).pathname;
    if (path.endsWith('/auth/login/')) {
      const email = route.request().postDataJSON().email;
      return route.fulfill({ json: { user: { id: email.startsWith('one') ? '1' : '2', email, emailVerified: true }, token: 'synthetic-' + email } });
    }
    if (path.endsWith('/auth/logout/')) return route.fulfill({ json: {} });
    if (path.endsWith('/records/changes/')) return route.fulfill({ json: { records: [], cursor: 1, hasMore: false } });
    if (path.endsWith('/records/operation/')) {
      requested(); await uploadRelease;
      const operation = route.request().postDataJSON();
      return route.fulfill({ json: { record: { ...operation, revision: 2, sequence: 2 }, cursor: 2 } });
    }
    return route.fulfill({ status: 500, json: {} });
  });
  await prepare(page);
  await page.evaluate(async () => {
    const path = '/utils/sync.ts';
    const sync = await import(path) as typeof import('../../utils/sync');
    (window as Window & { syncTest?: Promise<void> }).syncTest = sync.syncNow();
  });
  await uploadStarted;
  try {
    await page.evaluate(async () => {
      const path = '/utils/authService.ts';
      const { authService } = await import(path) as typeof import('../../utils/authService');
      await authService.signOut();
      await authService.signIn('two@example.test', 'synthetic-password');
    });
  } finally { release(); }
  const result = await page.evaluate(async () => {
    await (window as Window & { syncTest?: Promise<void> }).syncTest;
    const wp = '/utils/workspace.ts', dp = '/utils/persistence/trainingDatabase.ts';
    const workspace = await import(wp) as typeof import('../../utils/workspace');
    const { openTrainingDatabase } = await import(dp) as typeof import('../../utils/persistence/trainingDatabase');
    const db = await openTrainingDatabase();
    const previous = await db.read('1'); db.close();
    return { owner: workspace.scope(), workspace: workspace.readWorkspace(), previous };
  });
  expect(result.owner).toBe('2');
  expect(result.workspace.data.neuroLift_units).toBeUndefined();
  expect(Object.values(result.previous!.metadata.recordSync!.pending)[0].operation!.value).toBe('lbs');
  expect(result.previous!.metadata.recordSync!.baseline['["settings","neuroLift_units"]'].revision).toBe(1);
});
