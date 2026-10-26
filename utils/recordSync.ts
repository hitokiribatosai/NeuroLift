import { api, ApiError } from './authService';
import { recordSyncCommand, recordSyncSnapshot, scope } from './workspace';
import { CloudRecord } from './persistence/recordSyncState';

type ChangePage = { records: CloudRecord[]; cursor: number; hasMore: boolean };
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
