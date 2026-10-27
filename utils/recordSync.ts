import { api, ApiError } from './authService';
import { recordSyncCommand, recordSyncSnapshot, scope } from './workspace';
import { CloudRecord } from './persistence/recordSyncState';

type ChangePage = { records: CloudRecord[]; cursor: number; hasMore: boolean };
/** Explicit staged entry point; never invoked automatically for a legacy account. */
export async function beginRecordSync(owner: string, snapshotVersion: number) {
  await recordSyncCommand(owner, db => db.beginRecordEnrollment(owner, snapshotVersion));
  await resumeRecordEnrollment(owner);
}

/** Called only after the server rejects snapshots for an already-migrated account. */
export async function joinRecordSync(owner: string) {
  await recordSyncCommand(owner, db => db.beginRecordEnrollment(owner, 0, 'join'));
  await resumeRecordEnrollment(owner);
}

export async function resumeRecordEnrollment(owner: string) {
  const guard = () => { if (owner !== scope()) throw new Error('Account changed during enrollment'); };
  const initial = await recordSyncSnapshot(owner);
  if (initial?.metadata.recordSync) return;
  if (!initial?.metadata.enrollment) throw new Error('No saved enrollment checkpoint');
  // A lost response is safe: the server's migration endpoint is idempotent.
  if (initial.metadata.enrollment.mode !== 'join') {
    const version = initial.metadata.enrollment.baseline.version;
    let migrated: { protocol: number };
    try { migrated = await api('/records/migrate/', 'POST', { version }); }
    catch (error) {
      guard();
      if (error instanceof ApiError && error.status === 409) {
        await recordSyncCommand(owner, db => db.cancelRejectedEnrollment(owner, version));
        throw new Error('The server snapshot changed. Synchronize the account before retrying the upgrade.', { cause: error });
      }
      throw error;
    }
    guard();
    if (migrated.protocol !== 2) throw new Error('Unsupported synchronization protocol');
  }
  for (let pages = 0; pages < 200; pages++) {
    const current = await recordSyncSnapshot(owner);
    if (current?.metadata.recordSync) return;
    const enrollment = current?.metadata.enrollment;
    if (!enrollment) throw new Error('Enrollment checkpoint disappeared');
    if (enrollment.complete) {
      await recordSyncCommand(owner, db => db.finalizeRecordEnrollment(owner));
      return;
    }
    const cursor = enrollment.pulled.cursor;
    const page = await api<ChangePage>('/records/changes/?cursor=' + cursor);
    guard();
    if (!Array.isArray(page.records)) throw new Error('Invalid enrollment response');
    await recordSyncCommand(owner, db => db.saveEnrollmentPage(owner, page.records, page.cursor, page.hasMore, cursor));
  }
  throw new Error('Enrollment paused after a bounded pass. Retry to resume the saved checkpoint.');
}

export async function synchronizeRecords(owner: string) {
  const guard = () => { if (owner !== scope()) throw new Error('Account changed during synchronization'); };
  const pull = async () => {
    for (let pages = 0; pages < 200; pages++) {
      guard();
      const state = (await recordSyncSnapshot(owner))?.metadata.recordSync;
      if (!state) throw new Error('Record sync is not initialized');
      const page = await api<ChangePage>('/records/changes/?cursor=' + state.cursor);
      guard();
      if (!Array.isArray(page.records) || typeof page.hasMore !== 'boolean'
        || (page.hasMore && page.cursor <= state.cursor)) throw new Error('Invalid synchronization page');
      await recordSyncCommand(owner, db => db.applyRecordPage(owner, page.records, page.cursor));
      if (!page.hasMore) return;
    }
    throw new Error('Too many synchronization pages. Retry to continue from the saved cursor.');
  };
  await pull();
  // Bound one pass; remaining work stays durable and gets another scheduled pass.
  for (let count = 0; count < 100; count++) {
    guard();
    const operation = await recordSyncCommand(owner, db => db.prepareOperation(owner));
    if (!operation) break;
    try {
      const result = await api<{ record: CloudRecord }>('/records/operation/', 'POST', operation);
      guard();
      await recordSyncCommand(owner, db => db.acknowledgeOperation(owner, operation, result.record));
    } catch (error) {
      guard();
      if (error instanceof ApiError && error.status === 409 && error.details && typeof error.details === 'object'
        && 'current' in error.details && error.details.current) {
        const current = error.details.current as CloudRecord;
        await recordSyncCommand(owner, db => db.rejectRecordOperation(owner, operation, current));
      } else throw error;
    }
  }
  await pull();
  return (await recordSyncSnapshot(owner))!.metadata.recordSync!;
}
