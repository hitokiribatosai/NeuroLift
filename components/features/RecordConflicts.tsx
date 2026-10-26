import React, { useState } from 'react';
import { useCopy } from '../../hooks/useCopy';
import { PendingRecord, CloudValue } from '../../utils/persistence/recordSyncState';
import { resolveSyncRecord } from '../../utils/sync';
import { readRecoveryBundle } from '../../utils/workspace';
import { exportJsonFile } from '../../utils/exportFile';
import './recordConflicts.css';

export function RecordConflicts({ records }: { records: PendingRecord[] }) {
  const c = useCopy();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const preview = (value: CloudValue) => value.deleted ? c('record_deleted') : JSON.stringify(value.value, null, 2);
  const title = (record: PendingRecord) => {
    const value = record.desired.value;
    return value && typeof value === 'object' && 'name' in value && typeof value.name === 'string'
      ? value.name : `${record.desired.kind} · ${record.desired.id}`;
  };
  return <section className="record-conflicts" aria-label={c('record_conflicts_title')}>
    <h2>{c('record_conflicts_title')}</h2><p>{c('record_conflicts_help')}</p>
    <button disabled={busy} onClick={async () => {
      setBusy(true); setError(false);
      try { await exportJsonFile('neurolift-sync-recovery.json', await readRecoveryBundle()); }
      catch { setError(true); }
      finally { setBusy(false); }
    }}>{c('storage_export_recovery')}</button>
    {error && <p role="alert">{c('storage_export_failed')}</p>}
    {records.map(record => <article key={JSON.stringify([record.desired.kind, record.desired.id])}>
      <h3>{title(record)}</h3>
      <details><summary>{c('record_compare')}</summary>
        <h4>{c('record_local')}</h4><pre>{preview(record.desired)}</pre>
        <h4>{c('record_remote')}</h4><pre>{preview(record.conflict!)}</pre>
      </details>
      <div className="record-conflict-actions">
        {(['local', 'remote'] as const).map(choice => <button key={choice} disabled={busy} onClick={async () => {
          setBusy(true);
          try { await resolveSyncRecord(record, choice); } finally { setBusy(false); }
        }}>{c(choice === 'local' ? 'record_keep_local' : 'record_keep_remote')}</button>)}
      </div>
    </article>)}
  </section>;
}
