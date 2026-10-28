import React, { useEffect, useState } from 'react';
import { useCopy } from '../../hooks/useCopy';
import { exportJsonFile } from '../../utils/exportFile';
import { readRecoveryBundle, recordSyncSnapshot, scope } from '../../utils/workspace';
import { recoverAccountRecords, upgradeAccountRecords } from '../../utils/sync';
import './recordConflicts.css';

/** Export and explicit consent before reconciling an old device with record sync. */
export function RecordRecovery({ upgrade = false }: { upgrade?: boolean }) {
  const c = useCopy();
  const [checkpoint, setCheckpoint] = useState<{ owner: string; version: number; generation: number } | null>(null);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const [available, setAvailable] = useState(!upgrade);
  useEffect(() => {
    let active = true;
    if (upgrade) void recordSyncSnapshot().then(snapshot => {
      if (active) setAvailable(!!snapshot && !snapshot.metadata.dirty && !snapshot.metadata.recordSync && !snapshot.metadata.enrollment);
    }).catch(() => { if (active) setAvailable(false); });
    return () => { active = false; };
  }, [upgrade]);
  if (!available) return null;
  return <section className="record-conflicts" aria-label={c(upgrade ? 'record_upgrade_title' : 'record_recovery_title')}>
    <h2>{c(upgrade ? 'record_upgrade_title' : 'record_recovery_title')}</h2><p>{c(upgrade ? 'record_upgrade_help' : 'record_recovery_help')}</p>
    <button disabled={busy} onClick={async () => {
      setBusy(true); setFailed(false); setCheckpoint(null);
      try {
        const bundle = await readRecoveryBundle();
        if (!bundle.durable || bundle.owner !== scope()) throw new Error('Account changed');
        await exportJsonFile('neurolift-account-recovery.json', bundle);
        setCheckpoint({ owner: bundle.owner, version: bundle.durable.metadata.workspaceVersion ?? bundle.durable.metadata.source.version,
          generation: bundle.durable.metadata.generation });
      } catch { setFailed(true); }
      finally { setBusy(false); }
    }}>{c('storage_export_recovery')}</button>
    <button disabled={busy || !checkpoint} onClick={async () => {
      if (!checkpoint) return;
      setBusy(true); setFailed(false);
      try { await (upgrade ? upgradeAccountRecords : recoverAccountRecords)(checkpoint.owner, checkpoint.version, checkpoint.generation); }
      catch { setFailed(true); setCheckpoint(null); }
      finally { setBusy(false); }
    }}>{c(upgrade ? 'record_upgrade_begin' : 'record_recovery_begin')}</button>
    {failed && <p role="alert">{c('record_recovery_failed')}</p>}
  </section>;
}
