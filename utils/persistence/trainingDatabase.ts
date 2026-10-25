import { DBSchema, openDB } from 'idb';
import { CompletedWorkout } from '../../types';
import { removeSessionData } from '../sessionDraft';
import { normalizeCompletedWorkout } from '../workoutCompletion';
import { Workspace } from '../workspace';
import { assertOwner, MigrationCandidate, prepareLegacyMigration, RecordKind, TrainingRecord } from './legacyMigration';

interface CandidateMetadata {
  owner: string;
  schema: 1;
  // Still a migration candidate, not the app's canonical data source.
  status: 'candidate';
  generation: number;
  dirty: boolean;
  settings: Record<string, string>;
  source: Workspace;
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
 * Staged IndexedDB adapter. Not imported by the app until every mutation path can
 * await durable commits. Explicit owners prevent async work following a new login.
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

  return { migrate, read, saveDraft, completeWorkout, close: () => connection.close() };
}
