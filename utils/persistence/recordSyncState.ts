import { SYNC_KEYS, Workspace } from '../workspace';

export type CloudKind = 'workouts' | 'journal' | 'templates' | 'schedule' | 'settings';
export type CloudValue = { kind: CloudKind; id: string; deleted: boolean; value: unknown };
export type CloudRecord = CloudValue & { revision: number; sequence: number };
export type CloudOperation = CloudValue & { operationId: string; baseRevision: number };
export type PendingRecord = { desired: CloudValue; operation?: CloudOperation; conflict?: CloudRecord };
export type RecordSyncState = {
  cursor: number;
  baseline: Record<string, CloudRecord>;
  pending: Record<string, PendingRecord>;
  resolutions: { local: CloudValue; remote: CloudRecord; choice: 'local' | 'remote' }[];
};
const collections = { workouts: 'neuroLift_history', journal: 'neuroLift_journal', templates: 'neuroLift_templates' } as const;
export const recordKey = (record: Pick<CloudValue, 'kind' | 'id'>) => JSON.stringify([record.kind, record.id]);
const canonical = (value: unknown): string => {
  if (Array.isArray(value)) return '[' + value.map(canonical).join(',') + ']';
  if (value && typeof value === 'object') return '{' + Object.entries(value).sort(([a], [b]) => a.localeCompare(b))
    .map(([key, entry]) => JSON.stringify(key) + ':' + canonical(entry)).join(',') + '}';
  return JSON.stringify(value);
};
export const sameValue = (a: CloudValue, b: CloudValue) => a.deleted === b.deleted && canonical(a.value) === canonical(b.value);
const tombstone = (record: CloudValue): CloudValue => ({ kind: record.kind, id: record.id, deleted: true, value: null });
function validateRecord(record: CloudRecord) {
  if (!record || !['workouts', 'journal', 'templates', 'schedule', 'settings'].includes(record.kind)
    || typeof record.id !== 'string' || !record.id || record.id.length > 128 || typeof record.deleted !== 'boolean'
    || (record.deleted && record.value !== null) || !Number.isSafeInteger(record.revision) || record.revision < 1
    || !Number.isSafeInteger(record.sequence) || record.sequence < 1) throw new Error('Invalid remote record');
}

/** Workspace has already passed repository validation; excludes all device-local keys. */
export function cloudValues(workspace: Workspace): Record<string, CloudValue> {
  const result: Record<string, CloudValue> = {};
  const add = (kind: CloudKind, id: string, value: unknown) => {
    const record = { kind, id, deleted: false, value };
    result[recordKey(record)] = record;
  };
  for (const [kind, key] of Object.entries(collections)) {
    for (const value of JSON.parse(workspace.data[key] || '[]') as { id: string }[]) add(kind as CloudKind, value.id, value);
  }
  for (const [id, value] of Object.entries(JSON.parse(workspace.data.neuroLift_weekly_schedule || '{}'))) add('schedule', id, value);
  const excluded = new Set<string>([...Object.values(collections), 'neuroLift_weekly_schedule']);
  for (const key of SYNC_KEYS) if (!excluded.has(key) && workspace.data[key] !== undefined) add('settings', key, workspace.data[key]);
  return result;
}

/** Called in the SAME transaction as each local workspace mutation. */
export function enqueueChanges(state: RecordSyncState, before: Workspace, after: Workspace) {
  const previous = cloudValues(before), next = cloudValues(after);
  for (const key of new Set([...Object.keys(previous), ...Object.keys(next)])) {
    const desired = next[key] || tombstone(previous[key]);
    if (previous[key] && sameValue(previous[key], desired)) continue;
    const pending = state.pending[key];
    const base = state.baseline[key] || tombstone(desired);
    // Never mutate a dispatched payload: later edits wait behind its acknowledgement.
    if (!pending?.operation && !pending?.conflict && sameValue(base, desired)) delete state.pending[key];
    else state.pending[key] = { ...pending, desired: structuredClone(desired) };
  }
}

/** Must commit before sending. Retries return the exact same immutable operation. */
export function nextOperation(state: RecordSyncState, newId: () => string): CloudOperation | null {
  for (const [key, pending] of Object.entries(state.pending)) {
    if (pending.conflict) continue;
    if (!pending.operation) pending.operation = { ...structuredClone(pending.desired),
      operationId: newId(), baseRevision: state.baseline[key]?.revision || 0 };
    return structuredClone(pending.operation);
  }
  return null;
}

export function acknowledge(state: RecordSyncState, operation: CloudOperation, record: CloudRecord) {
  validateRecord(record);
  const key = recordKey(operation), pending = state.pending[key];
  // Another tab may already have acknowledged this exact receipt.
  if (!pending || pending.operation?.operationId !== operation.operationId) return;
  if (recordKey(record) !== key || record.revision !== operation.baseRevision + 1 || !sameValue(operation, record)) throw new Error('Invalid synchronization receipt');
  const newer = state.baseline[key];
  if (!newer || newer.revision <= record.revision) state.baseline[key] = record;
  if (pending.conflict && pending.conflict.revision <= record.revision) delete pending.conflict;
  delete pending.operation;
  if (!pending.conflict && sameValue(pending.desired, state.baseline[key])) delete state.pending[key];
  // Deliberately do not advance the pull cursor: unrelated server changes may precede this receipt.
}

/** Store a revision conflict without discarding either user's version. */
export function rejectOperation(state: RecordSyncState, operation: CloudOperation, remote: CloudRecord) {
  validateRecord(remote);
  const key = recordKey(operation), pending = state.pending[key];
  if (!pending || pending.operation?.operationId !== operation.operationId) return;
  if (recordKey(remote) !== key) throw new Error('Invalid conflict response');
  const latest = state.baseline[key];
  const current = latest && latest.revision > remote.revision ? latest : remote;
  state.baseline[key] = current;
  delete pending.operation;
  if (sameValue(pending.desired, current)) delete state.pending[key];
  else pending.conflict = current;
}

/** Validated server page and cursor commit atomically with materialized local values. */
export function receivePage(state: RecordSyncState, records: CloudRecord[], cursor: number) {
  if (!Number.isSafeInteger(cursor) || cursor < state.cursor) throw new Error('Invalid synchronization cursor');
  let previousSequence = state.cursor;
  for (const remote of records) {
    validateRecord(remote);
    if (remote.sequence <= previousSequence || remote.sequence > cursor) throw new Error('Invalid record sequence');
    previousSequence = remote.sequence;
    const key = recordKey(remote), base = state.baseline[key], pending = state.pending[key];
    if (base && base.revision >= remote.revision) continue;
    state.baseline[key] = structuredClone(remote);
    if (pending) {
      if (pending.operation && sameValue(pending.operation, remote) && remote.revision === pending.operation.baseRevision + 1) {
        // A lost response can be recovered from the feed. Leave the immutable op
        // for receipt replay, because it may also have been an identical remote edit.
        continue;
      }
      if (!pending.operation && sameValue(pending.desired, remote)) delete state.pending[key];
      else pending.conflict = structuredClone(remote);
    }
  }
  state.cursor = cursor;
}

export function resolveRecord(state: RecordSyncState, key: string, choice: 'local' | 'remote', expectedRevision: number) {
  const pending = state.pending[key];
  if (!pending?.conflict || pending.conflict.revision !== expectedRevision) throw new Error('Conflict changed. Review both versions again.');
  state.resolutions.push({ local: structuredClone(pending.desired), remote: structuredClone(pending.conflict), choice });
  delete pending.operation;
  delete pending.conflict;
  if (choice === 'remote') delete state.pending[key];
}

export function materializeRecords(state: RecordSyncState, workspace: Workspace): Workspace {
  const result = structuredClone(workspace);
  const values: Record<string, CloudValue> = { ...state.baseline };
  for (const [key, pending] of Object.entries(state.pending)) values[key] = pending.desired;
  const live = Object.values(values).filter(value => !value.deleted);
  for (const [kind, key] of Object.entries(collections)) {
    const oldOrder = (JSON.parse(result.data[key] || '[]') as { id: string }[]).map(row => row.id);
    const rows = live.filter(row => row.kind === kind).sort((a, b) => oldOrder.indexOf(a.id) - oldOrder.indexOf(b.id));
    result.data[key] = JSON.stringify(rows.map(row => row.value));
  }
  result.data.neuroLift_weekly_schedule = JSON.stringify(Object.fromEntries(live.filter(row => row.kind === 'schedule').map(row => [row.id, row.value])));
  const excluded = new Set<string>([...Object.values(collections), 'neuroLift_weekly_schedule']);
  for (const key of SYNC_KEYS) if (!excluded.has(key)) delete result.data[key];
  for (const row of live.filter(row => row.kind === 'settings')) {
    if (!(SYNC_KEYS as readonly string[]).includes(row.id) || excluded.has(row.id) || typeof row.value !== 'string') throw new Error('Unsupported remote setting');
    result.data[row.id] = row.value;
  }
  result.dirty = Object.keys(state.pending).length > 0;
  return result;
}
