import { DBSchema, openDB } from 'idb';
import { CompletedWorkout } from '../../types';
import { removeSessionData } from '../sessionDraft';
import { normalizeCompletedWorkout } from '../workoutCompletion';
import { SYNC_KEYS, Workspace } from '../workspace';
import { assertOwner, MigrationCandidate, prepareLegacyMigration, RecordKind, TrainingRecord } from './legacyMigration';
import { acknowledge, CloudOperation, CloudRecord, cloudValues, enqueueChanges, finishEnrollment, materializeRecords, nextOperation,
  receivePage, recordKey, RecordSyncState, rejectOperation, resolveRecord, sameValue } from './recordSyncState';

interface CandidateMetadata {
  owner: string;
  schema: 1;
  // Activation is explicit; the production bootstrap still uses legacy storage.
  status: 'candidate' | 'active';
  generation: number;
  dirty: boolean;
  settings: Record<string, string>;
  source: Workspace;
  acceptedSource?: Workspace;
  workspaceVersion?: number;
  orders?: Partial<Record<RecordKind, string[]>>;
  collectionKeys?: string[];
  recordSync?: RecordSyncState;
  enrollment?: { mode?: 'upgrade' | 'join'; baseline: Workspace; pulled: RecordSyncState; complete: boolean };
}
interface TrainingDatabase extends DBSchema {
  records: { key: [string, RecordKind, string]; value: TrainingRecord; indexes: { owner: string } };
  drafts: { key: string; value: { owner: string; data: Record<string, string>; revision: number } };
  metadata: { key: string; value: CandidateMetadata };
  recovery: { key: number; value: { owner: string; createdAt: string; legacy: Workspace; snapshot: CandidateSnapshot }; indexes: { owner: string } };
}

export type CandidateSnapshot = {
  metadata: CandidateMetadata;
  records: TrainingRecord[];
  draft: { owner: string; data: Record<string, string>; revision: number };
};

/**
 * Staged IndexedDB adapter. Production initialization remains disabled until every
 * mutation path awaits commits. Explicit owners prevent writes following a login.
 */
export async function openTrainingDatabase(name = 'neurolift-training-v1') {
  const connection = await openDB<TrainingDatabase>(name, 2, {
    upgrade(db, oldVersion) {
      if (oldVersion < 1) {
      const records = db.createObjectStore('records', { keyPath: ['owner', 'kind', 'id'] });
      records.createIndex('owner', 'owner');
      db.createObjectStore('drafts', { keyPath: 'owner' });
      db.createObjectStore('metadata', { keyPath: 'owner' });
      }
      if (oldVersion < 2) db.createObjectStore('recovery', { autoIncrement: true }).createIndex('owner', 'owner');
    },
    blocking() { connection?.close(); },
  });

  async function read(owner: string): Promise<CandidateSnapshot | null> {
    assertOwner(owner);
    const tx = connection.transaction(['metadata', 'records', 'drafts'], 'readonly');
    const metadata = await tx.objectStore('metadata').get(owner);
    const records = await tx.objectStore('records').index('owner').getAll(owner);
    const draft = await tx.objectStore('drafts').get(owner);
    await tx.done;
    if (!metadata) return null;
    if (!draft) throw new Error('Incomplete migration');
    return { metadata, records, draft };
  }

  async function migrate(owner: string, source: Workspace): Promise<'created' | 'existing'> {
    const candidate = prepareLegacyMigration(owner, source);
    return install(candidate);
  }

  async function install(candidate: MigrationCandidate): Promise<'created' | 'existing'> {
    const { owner } = candidate;
    const tx = connection.transaction(['metadata', 'records', 'drafts'], 'readwrite');
    try {
      const metadata = tx.objectStore('metadata');
      const existing = await metadata.get(owner);
      if (existing) {
        if (JSON.stringify(existing.source) !== JSON.stringify(candidate.source)) {
          throw new Error('Legacy workspace changed; candidate requires explicit reconciliation');
        }
        await tx.done;
        return 'existing';
      }
      for (const record of candidate.records) await tx.objectStore('records').add(record);
      await tx.objectStore('drafts').add({ owner, data: candidate.draft, revision: 1 });
      await metadata.add({ owner, schema: 1, status: 'candidate', generation: 1,
        dirty: candidate.source.dirty, source: candidate.source, settings: candidate.settings });
      await tx.done;
      return 'created';
    } catch (error) {
      try { tx.abort(); } catch { /* Already aborted by IndexedDB. */ }
      await tx.done.catch(() => undefined);
      throw error;
    }
  }

  /** Compare-and-swap a draft: serializable across tabs, no last-writer-wins loss. */
  async function saveDraft(owner: string, data: Record<string, string>, expectedRevision: number) {
    assertOwner(owner);
    if (!data || typeof data !== 'object' || Array.isArray(data)
      || Object.values(data).some(value => typeof value !== 'string')) throw new Error('Invalid draft');
    const submitted = structuredClone(data);
    const tx = connection.transaction(['drafts', 'metadata'], 'readwrite');
    try {
      const metadata = await tx.objectStore('metadata').get(owner);
      const current = await tx.objectStore('drafts').get(owner);
      if (!metadata || !current) throw new Error('Workspace has not been migrated');
      if (current.revision !== expectedRevision) throw new Error('Draft revision conflict');
      const revision = current.revision + 1;
      await tx.objectStore('drafts').put({ owner, data: submitted, revision });
      await tx.objectStore('metadata').put({ ...metadata, generation: metadata.generation + 1 });
      await tx.done;
      return revision;
    } catch (error) {
      try { tx.abort(); } catch { /* Already aborted by IndexedDB. */ }
      await tx.done.catch(() => undefined);
      throw error;
    }
  }

  function workspaceFrom(snapshot: CandidateSnapshot): Workspace {
    const data = { ...snapshot.metadata.settings, ...snapshot.draft.data };
    for (const [kind, key] of [['workouts', 'neuroLift_history'], ['journal', 'neuroLift_journal'], ['templates', 'neuroLift_templates']] as const) {
      const rows = snapshot.records.filter(record => record.kind === kind && !record.deleted);
      const order = snapshot.metadata.orders?.[kind] || snapshot.metadata.source.data[key]
        && (JSON.parse(snapshot.metadata.source.data[key]) as { id: string }[]).map(row => row.id) || [];
      rows.sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id));
      if (rows.length || (snapshot.metadata.collectionKeys ?? Object.keys(snapshot.metadata.source.data)).includes(key)) data[key] = JSON.stringify(rows.map(row => row.value));
    }
    const schedule = snapshot.records.filter(record => record.kind === 'schedule' && !record.deleted);
    if (schedule.length || (snapshot.metadata.collectionKeys ?? Object.keys(snapshot.metadata.source.data)).includes('neuroLift_weekly_schedule')) {
      data.neuroLift_weekly_schedule = JSON.stringify(Object.fromEntries(schedule.map(row => [row.id, (row.value as { templateId: string }).templateId])));
    }
    return { data, version: snapshot.metadata.workspaceVersion ?? snapshot.metadata.source.version, dirty: snapshot.metadata.dirty };
  }

  /** Normalize before queueing so later commands compare against the same IDs. */
  function normalizeWorkspace(owner: string, source: Workspace): Workspace {
    const candidate = prepareLegacyMigration(owner, source);
    return workspaceFrom({
      metadata: { owner, schema: 1, status: 'active', generation: 0, dirty: source.dirty,
        source, settings: candidate.settings, collectionKeys: Object.keys(source.data) },
      draft: { owner, revision: 0, data: candidate.draft }, records: candidate.records,
    });
  }

  async function activate(owner: string, source: Workspace) {
    let snapshot = await read(owner);
    if (!snapshot) { await migrate(owner, source); snapshot = await read(owner); }
    if (!snapshot) throw new Error('Migration did not complete');
    if (JSON.stringify(snapshot.metadata.acceptedSource ?? snapshot.metadata.source) !== JSON.stringify(source)) throw new Error('Legacy data changed after migration. Preserve both copies before continuing.');
    const tx = connection.transaction('metadata', 'readwrite');
    const metadata = await tx.store.get(owner);
    if (!metadata) throw new Error('Missing workspace');
    await tx.store.put({ ...metadata, status: 'active' });
    await tx.done;
    return workspaceFrom(snapshot);
  }

  /** Explicit recovery choice. Preserve BOTH copies atomically before changing data. */
  async function reconcile(owner: string, source: Workspace, choice: 'database' | 'legacy', expectedGeneration: number) {
    const candidate = prepareLegacyMigration(owner, source);
    const tx = connection.transaction(['metadata', 'records', 'drafts', 'recovery'], 'readwrite');
    try {
      const metadata = await tx.objectStore('metadata').get(owner);
      const draft = await tx.objectStore('drafts').get(owner);
      const records = await tx.objectStore('records').index('owner').getAll(owner);
      if (!metadata || !draft || metadata.generation !== expectedGeneration) throw new Error('Saved data changed. Review the recovery choices again.');
      if (metadata.recordSync || metadata.enrollment) throw new Error('Record sync is active or enrolling. Export both copies and resolve through record recovery, not legacy replacement.');
      await tx.objectStore('recovery').add({ owner, createdAt: new Date().toISOString(), legacy: candidate.source,
        snapshot: { metadata, draft, records } });
      if (choice === 'legacy') {
        for (const row of records) await tx.objectStore('records').delete([owner, row.kind, row.id]);
        for (const row of candidate.records) await tx.objectStore('records').put(row);
        await tx.objectStore('drafts').put({ owner, data: candidate.draft, revision: draft.revision + 1 });
      }
      await tx.objectStore('metadata').put({ ...metadata,
        ...(choice === 'legacy' ? { settings: candidate.settings, orders: undefined,
          collectionKeys: Object.keys(source.data), workspaceVersion: source.version, dirty: source.dirty } : {}),
        acceptedSource: candidate.source, generation: metadata.generation + 1 });
      await tx.done;
    } catch (error) {
      try { tx.abort(); } catch { /* Already finished. */ }
      await tx.done.catch(() => undefined);
      throw error;
    }
  }

  async function recoveryCopies(owner: string) {
    assertOwner(owner);
    return connection.getAllFromIndex('recovery', 'owner', owner);
  }

  /** Patch only changed keys, rejecting concurrent edits to those same keys. */
  async function patchWorkspace(owner: string, before: Workspace, next: Workspace) {
    assertOwner(owner);
    const baseline = normalizeWorkspace(owner, before);
    const submitted = normalizeWorkspace(owner, next);
    const changed = [...new Set([...Object.keys(baseline.data), ...Object.keys(submitted.data)])]
      .filter(key => baseline.data[key] !== submitted.data[key]);
    const tx = connection.transaction(['drafts', 'records', 'metadata'], 'readwrite');
    try {
      const metadata = await tx.objectStore('metadata').get(owner);
      const draft = await tx.objectStore('drafts').get(owner);
      const rows = await tx.objectStore('records').index('owner').getAll(owner);
      if (!metadata || !draft || metadata.status !== 'active') throw new Error('Workspace not active');
      const current = workspaceFrom({ metadata, draft, records: rows });
      const original = structuredClone(current);
      // A stale cloud acknowledgement must never clear another tab's unsynced work.
      if (!submitted.dirty && SYNC_KEYS.some(key => current.data[key] !== baseline.data[key])) {
        throw new Error('Local data changed during synchronization. Retry before acknowledging.');
      }
      for (const key of changed) {
        if (current.data[key] !== baseline.data[key] && current.data[key] !== submitted.data[key]) throw new Error('Local data changed in another tab. Reload before editing.');
        if (submitted.data[key] === undefined) delete current.data[key];
        else current.data[key] = submitted.data[key];
      }
      if (submitted.version !== baseline.version) {
        if (current.version !== baseline.version) throw new Error('Sync revision changed');
        current.version = submitted.version;
      }
      const candidate = prepareLegacyMigration(owner, current);
      if (metadata.recordSync) enqueueChanges(metadata.recordSync, original, current);
      const records = tx.objectStore('records');
      const rowKey = (row: TrainingRecord) => JSON.stringify([row.kind, row.id]);
      const previous = new Map(rows.map(row => [rowKey(row), row]));
      for (const row of candidate.records) {
        const existing = previous.get(rowKey(row));
        if (!existing || JSON.stringify(existing.value) !== JSON.stringify(row.value)) await records.put({ ...row, revision: (existing?.revision || 0) + 1 });
        previous.delete(rowKey(row));
      }
      for (const row of previous.values()) await records.delete([owner, row.kind, row.id]);
      const orders = Object.fromEntries((['workouts', 'templates', 'journal', 'schedule'] as const)
        .map(kind => [kind, candidate.records.filter(row => row.kind === kind).map(row => row.id)]));
      await tx.objectStore('drafts').put({ owner, data: candidate.draft, revision: draft.revision + 1 });
      const updated = { ...metadata, orders, collectionKeys: Object.keys(current.data), settings: candidate.settings, generation: metadata.generation + 1,
        dirty: metadata.recordSync ? Object.keys(metadata.recordSync.pending).length > 0 : submitted.dirty, workspaceVersion: current.version };
      await tx.objectStore('metadata').put(updated);
      await tx.done;
      return workspaceFrom({ metadata: updated, draft: { owner, data: candidate.draft, revision: draft.revision + 1 }, records: candidate.records });
    } catch (error) {
      try { tx.abort(); } catch { /* Transaction already finished. */ }
      await tx.done.catch(() => undefined);
      throw error;
    }
  }

  /** One repository transaction for outbox, remote records and pull cursor. */
  async function updateRecordSync<T>(owner: string, update: (state: RecordSyncState, workspace: Workspace) => T, finish = false) {
    assertOwner(owner);
    const tx = connection.transaction(['metadata', 'records', 'drafts'], 'readwrite');
    try {
      const metadata = await tx.objectStore('metadata').get(owner);
      const draft = await tx.objectStore('drafts').get(owner);
      const rows = await tx.objectStore('records').index('owner').getAll(owner);
      if (!metadata || !draft || metadata.status !== 'active') throw new Error('Workspace is not active');
      const workspace = workspaceFrom({ metadata, draft, records: rows });
      if (finish && !metadata.recordSync) {
        if (!metadata.enrollment?.complete) throw new Error('Enrollment pull is incomplete');
        const { baseline, pulled } = metadata.enrollment;
        const remote = normalizeWorkspace(owner, materializeRecords(pulled, workspace));
        metadata.recordSync = finishEnrollment(pulled, baseline, workspace, remote);
        delete metadata.enrollment;
      }
      if (!metadata.recordSync) throw new Error('Record sync is not initialized');
      const result = update(metadata.recordSync, workspace);
      const materialized = materializeRecords(metadata.recordSync, workspace);
      const candidate = prepareLegacyMigration(owner, materialized);
      // Validate before changing records; the entire transaction rolls back on failure.
      for (const row of rows) await tx.objectStore('records').delete([owner, row.kind, row.id]);
      for (const row of candidate.records) {
        const previous = rows.find(old => old.kind === row.kind && old.id === row.id);
        await tx.objectStore('records').put({ ...row, revision: previous
          ? previous.revision + (JSON.stringify(previous.value) === JSON.stringify(row.value) ? 0 : 1) : 1 });
      }
      await tx.objectStore('metadata').put({ ...metadata, settings: candidate.settings,
        orders: Object.fromEntries((['workouts', 'journal', 'templates', 'schedule'] as const)
          .map(kind => [kind, candidate.records.filter(row => row.kind === kind).map(row => row.id)])),
        collectionKeys: Object.keys(materialized.data), dirty: materialized.dirty, generation: metadata.generation + 1 });
      await tx.done;
      return result;
    } catch (error) {
      try { tx.abort(); } catch { /* Already finished. */ }
      await tx.done.catch(() => undefined);
      throw error;
    }
  }

  async function beginRecordEnrollment(owner: string, expectedVersion: number, mode: 'upgrade' | 'join' = 'upgrade') {
    assertOwner(owner);
    if (owner === 'guest') throw new Error('Guest data cannot be uploaded');
    const tx = connection.transaction(['metadata', 'records', 'drafts'], 'readwrite');
    try {
      const metadata = await tx.objectStore('metadata').get(owner);
      const draft = await tx.objectStore('drafts').get(owner);
      const records = await tx.objectStore('records').index('owner').getAll(owner);
      if (!metadata || !draft || metadata.status !== 'active') throw new Error('Workspace is not active');
      if (!metadata.recordSync && !metadata.enrollment) {
        const baseline = workspaceFrom({ metadata, draft, records });
        if (baseline.dirty || baseline.version !== expectedVersion) throw new Error('Synchronize and reconcile the snapshot before enrolling');
        // A new device has no trustworthy baseline for old cached data. Never
        // infer deletions or overwrite that data from a fresh server download.
        if (mode === 'join' && (baseline.version !== 0 || Object.keys(cloudValues(baseline)).length)) {
          throw new Error('This device has existing account data. Export a recovery copy before reconciling it with the upgraded account; automatic replacement is blocked.');
        }
        metadata.enrollment = { mode, baseline, pulled: { cursor: 0, baseline: {}, pending: {}, resolutions: [] }, complete: false };
        await tx.objectStore('metadata').put({ ...metadata, generation: metadata.generation + 1 });
      }
      await tx.done;
    } catch (error) {
      try { tx.abort(); } catch { /* Already finished. */ }
      await tx.done.catch(() => undefined);
      throw error;
    }
  }

  async function saveEnrollmentPage(owner: string, records: CloudRecord[], cursor: number, hasMore: boolean, expectedCursor: number) {
    assertOwner(owner);
    const tx = connection.transaction('metadata', 'readwrite');
    try {
      const metadata = await tx.store.get(owner);
      if (!metadata?.enrollment || metadata.enrollment.complete || metadata.enrollment.pulled.cursor !== expectedCursor) throw new Error('Enrollment changed. Retry from its saved checkpoint');
      if (typeof hasMore !== 'boolean' || (hasMore && cursor <= expectedCursor)) throw new Error('Invalid enrollment page');
      receivePage(metadata.enrollment.pulled, records, cursor);
      metadata.enrollment.complete = !hasMore;
      await tx.store.put({ ...metadata, generation: metadata.generation + 1 });
      await tx.done;
    } catch (error) {
      try { tx.abort(); } catch { /* Already finished. */ }
      await tx.done.catch(() => undefined);
      throw error;
    }
  }

  const finalizeRecordEnrollment = (owner: string) => updateRecordSync(owner, () => undefined, true);

  /** Only after the migrate endpoint explicitly rejects the snapshot version. */
  async function cancelRejectedEnrollment(owner: string, version: number) {
    assertOwner(owner);
    const tx = connection.transaction('metadata', 'readwrite');
    try {
      const metadata = await tx.store.get(owner);
      if (!metadata?.enrollment || metadata.recordSync || metadata.enrollment.baseline.version !== version
        || metadata.enrollment.mode === 'join' || metadata.enrollment.pulled.cursor !== 0 || metadata.enrollment.complete) throw new Error('Enrollment already advanced; it cannot be cancelled');
      delete metadata.enrollment;
      await tx.store.put({ ...metadata, generation: metadata.generation + 1 });
      await tx.done;
    } catch (error) {
      try { tx.abort(); } catch { /* Already finished. */ }
      await tx.done.catch(() => undefined);
      throw error;
    }
  }

  /** Only attach after a complete, reconciled snapshot and a full server pull. */
  async function attachRecordSync(owner: string, records: CloudRecord[], cursor: number, expectedGeneration: number) {
    assertOwner(owner);
    if (owner === 'guest') throw new Error('Guest data cannot be uploaded');
    const tx = connection.transaction(['metadata', 'records', 'drafts'], 'readwrite');
    try {
      const metadata = await tx.objectStore('metadata').get(owner);
      const draft = await tx.objectStore('drafts').get(owner);
      const rows = await tx.objectStore('records').index('owner').getAll(owner);
      if (!metadata || !draft || metadata.status !== 'active' || metadata.generation !== expectedGeneration
        || metadata.recordSync || metadata.enrollment) throw new Error('Workspace changed during record-sync setup');
      const state: RecordSyncState = { cursor: 0, baseline: {}, pending: {}, resolutions: [] };
      receivePage(state, records, cursor);
      const workspace = workspaceFrom({ metadata, draft, records: rows });
      const local = cloudValues(workspace);
      const remote = cloudValues(normalizeWorkspace(owner, materializeRecords(state, workspace)));
      if (Object.keys(local).length !== Object.keys(remote).length
        || Object.entries(local).some(([key, value]) => !remote[key] || !sameValue(value, remote[key]))) {
        throw new Error('Reconcile local and remote data before enabling record sync');
      }
      await tx.objectStore('metadata').put({ ...metadata, recordSync: state, dirty: false, generation: metadata.generation + 1 });
      await tx.done;
    } catch (error) {
      try { tx.abort(); } catch { /* Already finished. */ }
      await tx.done.catch(() => undefined);
      throw error;
    }
  }

  const prepareOperation = (owner: string) => updateRecordSync(owner, state => nextOperation(state, () => crypto.randomUUID()));
  const acknowledgeOperation = (owner: string, operation: CloudOperation, record: CloudRecord) => updateRecordSync(owner, state => acknowledge(state, operation, record));
  const rejectRecordOperation = (owner: string, operation: CloudOperation, record: CloudRecord) => updateRecordSync(owner, state => rejectOperation(state, operation, record));
  const applyRecordPage = (owner: string, records: CloudRecord[], cursor: number) => updateRecordSync(owner, state => receivePage(state, records, cursor));
  const resolveRecordConflict = (owner: string, kind: CloudRecord['kind'], id: string, choice: 'local' | 'remote', revision: number) =>
    updateRecordSync(owner, state => resolveRecord(state, recordKey({ kind, id }), choice, revision));

  async function deleteWorkspace(owner: string) {
    assertOwner(owner);
    const tx = connection.transaction(['records', 'drafts', 'metadata', 'recovery'], 'readwrite');
    for (const key of await tx.objectStore('records').index('owner').getAllKeys(owner)) await tx.objectStore('records').delete(key);
    await tx.objectStore('drafts').delete(owner);
    await tx.objectStore('metadata').delete(owner);
    for (const key of await tx.objectStore('recovery').index('owner').getAllKeys(owner)) await tx.objectStore('recovery').delete(key);
    await tx.done;
  }

  async function completeWorkout(owner: string, record: CompletedWorkout, expectedDraftRevision: number) {
    assertOwner(owner);
    // Capture input before yielding so subsequent UI edits cannot change this command.
    const submitted = structuredClone(record);
    const tx = connection.transaction(['drafts', 'records', 'metadata'], 'readwrite');
    try {
      const records = tx.objectStore('records');
      const existing = await records.get([owner, 'workouts', submitted.id]);
      if (existing?.kind === 'workouts') {
        if (existing.deleted) throw new Error('Completed workout was deleted');
        await tx.done;
        return existing.value;
      }
      const metadata = await tx.objectStore('metadata').get(owner);
      const draft = await tx.objectStore('drafts').get(owner);
      if (!metadata || !draft) throw new Error('Workspace has not been migrated');
      if (draft.revision !== expectedDraftRevision) throw new Error('Draft revision conflict');
      if (draft.data.neuroLift_tracker_session_id !== submitted.id) throw new Error('Session changed while finishing');
      const completed = normalizeCompletedWorkout(submitted);
      if (metadata.recordSync) {
        const rows = await records.index('owner').getAll(owner);
        const before = workspaceFrom({ metadata, draft, records: rows });
        const after = structuredClone(before);
        const history = JSON.parse(after.data.neuroLift_history || '[]');
        after.data.neuroLift_history = JSON.stringify([...history, completed]);
        enqueueChanges(metadata.recordSync, before, after);
      }
      removeSessionData(draft.data);
      await records.add({ owner, kind: 'workouts', id: completed.id, revision: 1, deleted: false, value: completed });
      await tx.objectStore('drafts').put({ ...draft, revision: draft.revision + 1 });
      await tx.objectStore('metadata').put({ ...metadata, dirty: true, generation: metadata.generation + 1 });
      await tx.done;
      return completed;
    } catch (error) {
      try { tx.abort(); } catch { /* Already aborted by IndexedDB. */ }
      await tx.done.catch(() => undefined);
      throw error;
    }
  }

  return { migrate, read, saveDraft, completeWorkout, activate, reconcile, recoveryCopies, patchWorkspace, workspaceFrom, normalizeWorkspace, deleteWorkspace,
    attachRecordSync, prepareOperation, acknowledgeOperation, rejectRecordOperation, applyRecordPage, resolveRecordConflict,
    beginRecordEnrollment, saveEnrollmentPage, finalizeRecordEnrollment, cancelRejectedEnrollment,
    close: () => connection.close() };
}
