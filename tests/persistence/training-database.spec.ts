import { expect, test } from '@playwright/test';
import fixture from '../fixtures/legacy-workspace.json' with { type: 'json' };

test.beforeEach(async ({ page }) => { await page.goto('/tests/persistence/blank.html'); });

test('failed initialization never exposes an unhydrated database and permits recovery', async ({ page }) => {
  const result = await page.evaluate(async () => {
    localStorage.setItem('neuroLift_workspace_guest', 'broken');
    const path = '/utils/workspace.ts';
    const workspace = await import(path) as typeof import('../../utils/workspace');
    let failure = '';
    try { await workspace.initializeWorkspace(); } catch (error) { failure = String(error); }
    const enabledAfterFailure = workspace.databaseEnabled();
    const preserved = localStorage.getItem('neuroLift_workspace_guest');
    // Explicit test recovery, not automatic deletion of unreadable user data.
    localStorage.setItem('neuroLift_workspace_guest', JSON.stringify({ data: {}, version: 0, dirty: false }));
    await workspace.initializeWorkspace();
    return { failure, enabledAfterFailure, preserved, recovered: workspace.readWorkspace() };
  });
  expect(result.failure).toBeTruthy();
  expect(result.enabledAfterFailure).toBe(false);
  expect(result.preserved).toBe('broken');
  expect(result.recovered.data).toEqual({});
});

test('remote application rejects stale account ownership', async ({ page }) => {
  const result = await page.evaluate(async () => {
    const path = '/utils/workspace.ts';
    const workspace = await import(path) as typeof import('../../utils/workspace');
    await workspace.initializeWorkspace();
    await workspace.changeScope('1');
    let failure = '';
    try { await workspace.applyRemote({ neuroLift_templates: '[]' }, 3, 'guest'); }
    catch (error) { failure = String(error); }
    return { failure, current: workspace.readWorkspace() };
  });
  expect(result.failure).toContain('Account changed');
  expect(result.current).toEqual({ data: {}, version: 0, dirty: false });
});

test('completion retry waits for the first durable save and both reject on rollback', async ({ page }) => {
  const result = await page.evaluate(async source => {
    localStorage.setItem('neuroLift_workspace_guest', JSON.stringify(source));
    const path = '/utils/workspace.ts';
    const workspace = await import(path) as typeof import('../../utils/workspace');
    await workspace.initializeWorkspace();
    const completionPath = '/utils/workoutCompletion.ts';
    const { commitCompletedWorkout } = await import(completionPath) as typeof import('../../utils/workoutCompletion');
    const before = workspace.readWorkspace();
    const record = { id: before.data.neuroLift_tracker_session_id, date: '2026-10-25', durationSeconds: 120,
      totalVolume: 0, exercises: JSON.parse(before.data.neuroLift_tracker_active_exercises) };
    const put = IDBObjectStore.prototype.put;
    IDBObjectStore.prototype.put = function (value, key) {
      if (this.name === 'metadata') throw new DOMException('Injected completion queue failure', 'QuotaExceededError');
      return put.call(this, value, key);
    };
    const results = await Promise.allSettled([commitCompletedWorkout(record, 'guest'), commitCompletedWorkout(record, 'guest')]);
    IDBObjectStore.prototype.put = put;
    const dbPath = '/utils/persistence/trainingDatabase.ts';
    const { openTrainingDatabase } = await import(dbPath) as typeof import('../../utils/persistence/trainingDatabase');
    const db = await openTrainingDatabase();
    const after = db.workspaceFrom((await db.read('guest'))!);
    db.close(); return { statuses: results.map(result => result.status), before, after };
  }, fixture);
  expect(result.statuses).toEqual(['rejected', 'rejected']);
  expect(result.after).toEqual(result.before);
});

test('active patches preserve empty collections, removals and unrelated concurrent edits', async ({ page }) => {
  const result = await page.evaluate(async () => {
    const path = '/utils/persistence/trainingDatabase.ts';
    const { openTrainingDatabase } = await import(path) as typeof import('../../utils/persistence/trainingDatabase');
    const db = await openTrainingDatabase('patch-test');
    const source = { data: {}, version: 0, dirty: false };
    const before = await db.activate('guest', source);
    await db.patchWorkspace('guest', before, { ...before, dirty: true, data: { neuroLift_templates: '[]' } });
    const merged = await db.patchWorkspace('guest', before, { ...before, dirty: true, data: { language: 'fr' } });
    const next = structuredClone(merged);
    delete next.data.neuroLift_templates;
    const removed = await db.patchWorkspace('guest', merged, next);
    const reopened = await db.activate('guest', source);
    db.close();
    return { merged, removed, reopened };
  });
  expect(result.merged.data).toEqual({ neuroLift_templates: '[]', language: 'fr' });
  expect(result.removed.data).toEqual({ language: 'fr' });
  expect(result.reopened).toEqual(result.removed);
});

test('stale sync acknowledgement and same-key edits cannot overwrite another tab', async ({ page }) => {
  const result = await page.evaluate(async () => {
    const path = '/utils/persistence/trainingDatabase.ts';
    const { openTrainingDatabase } = await import(path) as typeof import('../../utils/persistence/trainingDatabase');
    const db = await openTrainingDatabase('ack-test');
    const before = await db.activate('guest', { data: {}, version: 0, dirty: false });
    const saved = await db.patchWorkspace('guest', before, { ...before, dirty: true, data: { neuroLift_templates: '[]' } });
    const failures: string[] = [];
    for (const next of [{ ...before, version: 1 }, { ...before, dirty: true, data: { neuroLift_templates: '[{"id":"t","name":"A","exercises":[]}]' } }]) {
      try { await db.patchWorkspace('guest', before, next); } catch (error) { failures.push(String(error)); }
    }
    const after = db.workspaceFrom((await db.read('guest'))!);
    db.close(); return { saved, after, failures };
  });
  expect(result.failures[0]).toContain('during synchronization');
  expect(result.failures[1]).toContain('another tab');
  expect(result.after).toEqual(result.saved);
  expect(result.after.dirty).toBe(true);
});

test('active patch abort rolls back records, draft and metadata together', async ({ page }) => {
  const result = await page.evaluate(async source => {
    const path = '/utils/persistence/trainingDatabase.ts';
    const { openTrainingDatabase } = await import(path) as typeof import('../../utils/persistence/trainingDatabase');
    const db = await openTrainingDatabase('patch-abort-test');
    const before = await db.activate('guest', source);
    const snapshot = await db.read('guest');
    const put = IDBObjectStore.prototype.put;
    IDBObjectStore.prototype.put = function (value, key) {
      if (this.name === 'metadata') throw new DOMException('Injected patch failure', 'QuotaExceededError');
      return put.call(this, value, key);
    };
    let failure = '';
    try { await db.patchWorkspace('guest', before, { ...before, data: { language: 'en' } }); }
    catch (error) { failure = String(error); }
    finally { IDBObjectStore.prototype.put = put; }
    const after = await db.read('guest');
    db.close(); return { snapshot, after, failure };
  }, fixture);
  expect(result.failure).toContain('Injected patch failure');
  expect(result.after).toEqual(result.snapshot);
});

test('workspace queue normalizes IDs before consecutive draft writes and waits before account switch', async ({ page }) => {
  const result = await page.evaluate(async source => {
    localStorage.setItem('neuroLift_workspace_guest', JSON.stringify(source));
    const path = '/utils/workspace.ts';
    const workspace = await import(path) as typeof import('../../utils/workspace');
    await workspace.initializeWorkspace();
    const first = workspace.readWorkspace();
    first.data.neuroLift_tracker_active_exercises = JSON.stringify([{ name: 'Bench Press', sets: [{ id: 's', weight: 10, reps: 5, completed: false }] }]);
    const save1 = workspace.writeWorkspace(first);
    const second = workspace.readWorkspace();
    const exercises = JSON.parse(second.data.neuroLift_tracker_active_exercises);
    exercises[0].sets[0].reps = 6;
    second.data.neuroLift_tracker_active_exercises = JSON.stringify(exercises);
    const save2 = workspace.writeWorkspace(second);
    await workspace.changeScope('1');
    await Promise.all([save1, save2]);
    const member = workspace.readWorkspace();
    await workspace.changeScope('guest');
    return { guest: workspace.readWorkspace(), member, status: workspace.persistenceState(), source: localStorage.getItem('neuroLift_workspace_guest') };
  }, fixture);
  const exercises = JSON.parse(result.guest.data.neuroLift_tracker_active_exercises);
  expect(exercises[0].id).toBeTruthy();
  expect(exercises[0].sets[0].reps).toBe(6);
  expect(result.member.data).toEqual({});
  expect(result.status).toEqual({ pending: 0, failure: '' });
  expect(result.source).toBe(JSON.stringify(fixture));
});

test('failed queued write blocks following writes and flush without changing durable data', async ({ page }) => {
  const result = await page.evaluate(async () => {
    const path = '/utils/workspace.ts';
    const workspace = await import(path) as typeof import('../../utils/workspace');
    await workspace.initializeWorkspace();
    const put = IDBObjectStore.prototype.put;
    IDBObjectStore.prototype.put = function (value, key) {
      if (this.name === 'metadata') throw new DOMException('Injected queue failure', 'QuotaExceededError');
      return put.call(this, value, key);
    };
    const first = workspace.writeWorkspace({ data: { language: 'fr' }, version: 0, dirty: false });
    const second = workspace.writeWorkspace({ data: { language: 'ar' }, version: 0, dirty: false });
    const results = await Promise.allSettled([first, second]);
    let failure = '';
    try { await workspace.flushWorkspace(); } catch (error) { failure = String(error); }
    IDBObjectStore.prototype.put = put;
    const dbPath = '/utils/persistence/trainingDatabase.ts';
    const { openTrainingDatabase } = await import(dbPath) as typeof import('../../utils/persistence/trainingDatabase');
    const db = await openTrainingDatabase();
    const saved = db.workspaceFrom((await db.read('guest'))!);
    db.close();
    return { statuses: results.map(result => result.status), saved, failure, status: workspace.persistenceState() };
  });
  expect(result.statuses).toEqual(['rejected', 'rejected']);
  expect(result.saved.data).toEqual({});
  expect(result.failure).toContain('Injected queue failure');
  expect(result.status.pending).toBe(0);
});

test('migration is durable, idempotent, account isolated and retains rollback source', async ({ page }) => {
  const result = await page.evaluate(async source => {
    const path = '/utils/persistence/trainingDatabase.ts';
    const { openTrainingDatabase } = await import(path) as typeof import('../../utils/persistence/trainingDatabase');
    const db = await openTrainingDatabase('migration-test');
    localStorage.setItem('source-under-test', JSON.stringify(source));
    const created = await db.migrate('guest', source);
    await db.migrate('1', { data: {}, version: 0, dirty: false });
    await db.saveDraft('guest', { test: 'saved' }, 1);
    const repeated = await db.migrate('guest', source);
    const guest = await db.read('guest');
    const member = await db.read('1');
    db.close();
    return { created, repeated, guest, member, raw: localStorage.getItem('source-under-test') };
  }, fixture);
  expect(result.created).toBe('created');
  expect(result.repeated).toBe('existing');
  expect(result.guest?.metadata.source).toEqual(fixture);
  expect(result.guest?.draft).toMatchObject({ revision: 2, data: { test: 'saved' } });
  expect(result.member?.records).toEqual([]);
  expect(result.raw).toBe(JSON.stringify(fixture));
  await page.reload();
  const restored = await page.evaluate(async () => {
    const path = '/utils/persistence/trainingDatabase.ts';
    const { openTrainingDatabase } = await import(path) as typeof import('../../utils/persistence/trainingDatabase');
    const db = await openTrainingDatabase('migration-test');
    try { return await db.read('guest'); } finally { db.close(); }
  });
  expect(restored).toEqual(result.guest);
});

test('failed migration transaction leaves no partial data and can be retried', async ({ page }) => {
  const result = await page.evaluate(async source => {
    const path = '/utils/persistence/trainingDatabase.ts';
    const { openTrainingDatabase } = await import(path) as typeof import('../../utils/persistence/trainingDatabase');
    const db = await openTrainingDatabase('rollback-test');
    const add = IDBObjectStore.prototype.add;
    let count = 0;
    IDBObjectStore.prototype.add = function (value, key) {
      if (this.name === 'records' && ++count === 2) throw new DOMException('Injected quota failure', 'QuotaExceededError');
      return add.call(this, value, key);
    };
    let failure = '';
    try { await db.migrate('guest', source); } catch (error) { failure = String(error); }
    finally { IDBObjectStore.prototype.add = add; }
    const afterFailure = await db.read('guest');
    const retry = await db.migrate('guest', source);
    const afterRetry = await db.read('guest');
    db.close();
    return { failure, afterFailure, retry, afterRetry };
  }, fixture);
  expect(result.failure).toContain('Injected quota failure');
  expect(result.afterFailure).toBeNull();
  expect(result.retry).toBe('created');
  expect(result.afterRetry?.records).toHaveLength(3);
});

test('changed legacy source cannot silently replace a previously prepared candidate', async ({ page }) => {
  const result = await page.evaluate(async source => {
    const path = '/utils/persistence/trainingDatabase.ts';
    const { openTrainingDatabase } = await import(path) as typeof import('../../utils/persistence/trainingDatabase');
    const db = await openTrainingDatabase('source-conflict-test');
    await db.migrate('guest', source);
    let failure = '';
    try { await db.migrate('guest', { ...source, version: source.version + 1 }); }
    catch (error) { failure = String(error); }
    const state = await db.read('guest');
    db.close();
    return { failure, state };
  }, fixture);
  expect(result.failure).toContain('explicit reconciliation');
  expect(result.state?.metadata.source).toEqual(fixture);
});

test('two tabs racing a draft revision cannot silently overwrite each other', async ({ page, context }) => {
  await page.evaluate(async source => {
    const path = '/utils/persistence/trainingDatabase.ts';
    const { openTrainingDatabase } = await import(path) as typeof import('../../utils/persistence/trainingDatabase');
    const db = await openTrainingDatabase('race-test');
    await db.migrate('guest', source);
    db.close();
  }, fixture);
  const second = await context.newPage();
  await second.goto('/tests/persistence/blank.html');
  const results = await Promise.all([page, second].map((tab, index) => tab.evaluate(async index => {
    const path = '/utils/persistence/trainingDatabase.ts';
    const { openTrainingDatabase } = await import(path) as typeof import('../../utils/persistence/trainingDatabase');
    const db = await openTrainingDatabase('race-test');
    try { return { revision: await db.saveDraft('guest', { tab: String(index) }, 1), failure: '' }; }
    catch (error) { return { revision: 0, failure: String(error) }; }
    finally { db.close(); }
  }, index)));
  expect(results.filter(result => result.revision === 2)).toHaveLength(1);
  expect(results.filter(result => result.failure.includes('Draft revision conflict'))).toHaveLength(1);
  await second.close();
});

test('draft and metadata roll back together when a write fails after the draft put', async ({ page }) => {
  const result = await page.evaluate(async source => {
    const path = '/utils/persistence/trainingDatabase.ts';
    const { openTrainingDatabase } = await import(path) as typeof import('../../utils/persistence/trainingDatabase');
    const db = await openTrainingDatabase('draft-abort-test');
    await db.migrate('guest', source);
    const before = await db.read('guest');
    const put = IDBObjectStore.prototype.put;
    IDBObjectStore.prototype.put = function (value, key) {
      if (this.name === 'metadata') throw new DOMException('Injected abort', 'AbortError');
      return put.call(this, value, key);
    };
    let failure = '';
    try { await db.saveDraft('guest', { test: 'must roll back' }, 1); }
    catch (error) { failure = String(error); }
    finally { IDBObjectStore.prototype.put = put; }
    const after = await db.read('guest');
    db.close();
    return { before, after, failure };
  }, fixture);
  expect(result.failure).toContain('Injected abort');
  expect(result.after).toEqual(result.before);
});

test('concurrent completion commits once, clears clocks and leaves other accounts untouched', async ({ page }) => {
  const result = await page.evaluate(async source => {
    const path = '/utils/persistence/trainingDatabase.ts';
    const { openTrainingDatabase } = await import(path) as typeof import('../../utils/persistence/trainingDatabase');
    const first = await openTrainingDatabase('completion-test');
    const second = await openTrainingDatabase('completion-test');
    await first.migrate('guest', source);
    await first.migrate('1', source);
    const before = await first.read('guest');
    const member = await first.read('1');
    const record = { id: before!.draft.data.neuroLift_tracker_session_id, date: '2026-10-25',
      durationSeconds: 120, totalVolume: 0, exercises: JSON.parse(before!.draft.data.neuroLift_tracker_active_exercises) };
    const completed = await Promise.all([first.completeWorkout('guest', record, 1), second.completeWorkout('guest', record, 1)]);
    const state = await first.read('guest');
    const memberAfter = await first.read('1');
    // Retrying an earlier completion must not discard a newly started draft.
    await first.saveDraft('guest', { neuroLift_tracker_session_id: 'next-session' }, state!.draft.revision);
    const next = await first.read('guest');
    await second.completeWorkout('guest', record, 1);
    const afterRetry = await second.read('guest');
    first.close(); second.close();
    return { completed, state, member, memberAfter, next, afterRetry };
  }, fixture);
  expect(result.completed[0]).toEqual(result.completed[1]);
  expect(result.completed[0].totalVolume).toBe(550);
  expect(result.state?.records.filter(record => record.kind === 'workouts')).toHaveLength(2);
  expect(result.state?.draft.data).toEqual({});
  expect(result.state?.metadata.dirty).toBe(true);
  expect(result.state?.metadata.source).toEqual(fixture);
  expect(result.memberAfter).toEqual(result.member);
  expect(result.afterRetry).toEqual(result.next);
});

test('completion failure after history insertion rolls back history, clocks and metadata', async ({ page }) => {
  const result = await page.evaluate(async source => {
    const path = '/utils/persistence/trainingDatabase.ts';
    const { openTrainingDatabase } = await import(path) as typeof import('../../utils/persistence/trainingDatabase');
    const db = await openTrainingDatabase('completion-abort-test');
    await db.migrate('guest', source);
    const before = await db.read('guest');
    const record = { id: before!.draft.data.neuroLift_tracker_session_id, date: '2026-10-25', durationSeconds: 120,
      totalVolume: 0, exercises: JSON.parse(before!.draft.data.neuroLift_tracker_active_exercises) };
    const put = IDBObjectStore.prototype.put;
    IDBObjectStore.prototype.put = function (value, key) {
      if (this.name === 'drafts') throw new DOMException('Injected completion failure', 'QuotaExceededError');
      return put.call(this, value, key);
    };
    let failure = '';
    try { await db.completeWorkout('guest', record, 1); }
    catch (error) { failure = String(error); }
    finally { IDBObjectStore.prototype.put = put; }
    const after = await db.read('guest');
    const retry = await db.completeWorkout('guest', record, 1);
    db.close();
    return { before, after, failure, retry };
  }, fixture);
  expect(result.failure).toContain('Injected completion failure');
  expect(result.after).toEqual(result.before);
  expect(result.retry.totalVolume).toBe(550);
});

test('stale completion revision is rejected without losing a newer draft', async ({ page }) => {
  const result = await page.evaluate(async source => {
    const path = '/utils/persistence/trainingDatabase.ts';
    const { openTrainingDatabase } = await import(path) as typeof import('../../utils/persistence/trainingDatabase');
    const db = await openTrainingDatabase('stale-completion-test');
    await db.migrate('guest', source);
    const original = await db.read('guest');
    await db.saveDraft('guest', original!.draft.data, 1);
    const before = await db.read('guest');
    let failure = '';
    try { await db.completeWorkout('guest', { id: original!.draft.data.neuroLift_tracker_session_id,
      date: '2026-10-25', durationSeconds: 120, totalVolume: 0,
      exercises: JSON.parse(original!.draft.data.neuroLift_tracker_active_exercises) }, 1); }
    catch (error) { failure = String(error); }
    const after = await db.read('guest');
    db.close();
    return { before, after, failure };
  }, fixture);
  expect(result.failure).toContain('Draft revision conflict');
  expect(result.after).toEqual(result.before);
});
