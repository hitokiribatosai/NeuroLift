import { DBSchema, openDB } from 'idb';
import { CompletedWorkout } from '../../types';
import { removeSessionData } from '../sessionDraft';
import { normalizeCompletedWorkout } from '../workoutCompletion';
import { SYNC_KEYS, Workspace } from '../workspace';
import { assertOwner, MigrationCandidate, prepareLegacyMigration, RecordKind, TrainingRecord } from './legacyMigration';

interface CandidateMetadata {
  owner: string;
  schema: 1;
  // Activation is explicit; the production bootstrap still uses legacy storage.
  status: 'candidate' | 'active';
  generation: number;
  dirty: boolean;
  settings: Record<string, string>;
  source: Workspace;
  workspaceVersion?: number;
  orders?: Partial<Record<RecordKind, string[]>>;
  collectionKeys?: string[];
}
interface TrainingDatabase extends DBSchema {
  records: { key: [string, RecordKind, string]; value: TrainingRecord; indexes: { owner: string } };
  drafts: { key: string; value: { owner: string; data: Record<string, string>; revision: number } };
  metadata: { key: string; value: CandidateMetadata };
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
  const connection = await openDB<TrainingDatabase>(name, 1, {
    upgrade(db) {
      const records = db.createObjectStore('records', { keyPath: ['owner', 'kind', 'id'] });
      records.createIndex('owner', 'owner');
      db.createObjectStore('drafts', { keyPath: 'owner' });
      db.createObjectStore('metadata', { keyPath: 'owner' });
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
    if (JSON.stringify(snapshot.metadata.source) !== JSON.stringify(source)) throw new Error('Legacy data changed after migration. Preserve both copies before continuing.');
    const tx = connection.transaction('metadata', 'readwrite');
    const metadata = await tx.store.get(owner);
    if (!metadata) throw new Error('Missing workspace');
    await tx.store.put({ ...metadata, status: 'active' });
    await tx.done;
    return workspaceFrom(snapshot);
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
        dirty: submitted.dirty, workspaceVersion: current.version };
      await tx.objectStore('metadata').put(updated);
      await tx.done;
      return workspaceFrom({ metadata: updated, draft: { owner, data: candidate.draft, revision: draft.revision + 1 }, records: candidate.records });
    } catch (error) {
      try { tx.abort(); } catch { /* Transaction already finished. */ }
      await tx.done.catch(() => undefined);
      throw error;
    }
  }

  async function deleteWorkspace(owner: string) {
    assertOwner(owner);
    const tx = connection.transaction(['records', 'drafts', 'metadata'], 'readwrite');
    for (const key of await tx.objectStore('records').index('owner').getAllKeys(owner)) await tx.objectStore('records').delete(key);
    await tx.objectStore('drafts').delete(owner);
    await tx.objectStore('metadata').delete(owner);
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

  return { migrate, read, saveDraft, completeWorkout, activate, patchWorkspace, workspaceFrom, normalizeWorkspace, deleteWorkspace, close: () => connection.close() };
}
