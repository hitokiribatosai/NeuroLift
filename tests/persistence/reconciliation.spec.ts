import { expect, test } from '@playwright/test';

for (const choice of ['database', 'legacy'] as const) {
  test(`explicit ${choice} recovery keeps both versions and survives reopening`, async ({ page }) => {
    await page.goto('/tests/persistence/blank.html');
    const result = await page.evaluate(async choice => {
      const path = '/utils/persistence/trainingDatabase.ts';
      const { openTrainingDatabase } = await import(path) as typeof import('../../utils/persistence/trainingDatabase');
      const db = await openTrainingDatabase();
      const original = { data: { neuroLift_units: 'kg' }, dirty: false, version: 0 };
      await db.activate('guest', original);
      await db.patchWorkspace('guest', original, { ...original, data: { neuroLift_units: 'lbs' }, dirty: true });
      const incoming = { ...original, data: { neuroLift_units: 'kg', neuroLift_userGoal: 'strength' } };
      const before = (await db.read('guest'))!;
      let blocked = false;
      try { await db.activate('guest', incoming); } catch { blocked = true; }
      await db.reconcile('guest', incoming, choice, before.metadata.generation);
      db.close();
      const reopened = await openTrainingDatabase();
      const active = await reopened.activate('guest', incoming);
      const archives = await reopened.recoveryCopies('guest');
      const otherOwner = await reopened.recoveryCopies('1');
      const retainedSource = (await reopened.read('guest'))!.metadata.source;
      reopened.close();
      return { blocked, active, archives, otherOwner, retainedSource, original };
    }, choice);
    expect(result.blocked).toBe(true);
    expect(result.active.data.neuroLift_units).toBe(choice === 'database' ? 'lbs' : 'kg');
    expect(result.archives).toHaveLength(1);
    expect(result.archives[0].snapshot.metadata.settings.neuroLift_units).toBe('lbs');
    expect(result.archives[0].legacy.data.neuroLift_userGoal).toBe('strength');
    expect(result.otherOwner).toEqual([]);
    expect(result.retainedSource).toEqual(result.original);
  });
}

test('stale recovery choices cannot overwrite a newer database edit', async ({ page }) => {
  await page.goto('/tests/persistence/blank.html');
  const result = await page.evaluate(async () => {
    const path = '/utils/persistence/trainingDatabase.ts';
    const { openTrainingDatabase } = await import(path) as typeof import('../../utils/persistence/trainingDatabase');
    const db = await openTrainingDatabase();
    const original = { data: { neuroLift_units: 'kg' }, dirty: false, version: 0 };
    await db.activate('guest', original);
    const generation = (await db.read('guest'))!.metadata.generation;
    await db.patchWorkspace('guest', original, { ...original, data: { neuroLift_units: 'lbs' }, dirty: true });
    let rejected = false;
    try { await db.reconcile('guest', original, 'legacy', generation); } catch { rejected = true; }
    const snapshot = await db.read('guest');
    const copies = await db.recoveryCopies('guest');
    db.close();
    return { rejected, snapshot, copies };
  });
  expect(result.rejected).toBe(true);
  expect(result.snapshot!.metadata.settings.neuroLift_units).toBe('lbs');
  expect(result.copies).toEqual([]);
});

test('recovery failure rolls back the archive and replacement together', async ({ page }) => {
  await page.goto('/tests/persistence/blank.html');
  const result = await page.evaluate(async () => {
    const path = '/utils/persistence/trainingDatabase.ts';
    const { openTrainingDatabase } = await import(path) as typeof import('../../utils/persistence/trainingDatabase');
    const db = await openTrainingDatabase();
    const original = { data: { neuroLift_units: 'kg' }, dirty: false, version: 0 };
    await db.activate('guest', original);
    const before = (await db.read('guest'))!;
    const put = IDBObjectStore.prototype.put;
    IDBObjectStore.prototype.put = function (...args: Parameters<typeof put>) {
      if (this.name === 'metadata') throw new Error('Injected quota failure');
      return put.apply(this, args);
    };
    let rejected = false;
    try { await db.reconcile('guest', { ...original, data: { neuroLift_units: 'lbs' } }, 'legacy', before.metadata.generation); }
    catch { rejected = true; }
    finally { IDBObjectStore.prototype.put = put; }
    const after = await db.read('guest');
    const copies = await db.recoveryCopies('guest');
    db.close();
    return { rejected, before, after, copies };
  });
  expect(result.rejected).toBe(true);
  expect(result.after).toEqual(result.before);
  expect(result.copies).toEqual([]);
});
