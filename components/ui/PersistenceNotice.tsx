import React, { useEffect, useState } from 'react';
import { databaseEnabled, persistenceState, readRecoveryBundle } from '../../utils/workspace';
import { exportJsonFile } from '../../utils/exportFile';
import { safeStorage } from '../../utils/storage';
import { translateInterface } from '../../utils/interfaceCopy';
import './persistence.css';

/** Kept outside the workspace remount so save failures never erase form state. */
export function PersistenceNotice() {
  const [state, setState] = useState(persistenceState);
  const [exporting, setExporting] = useState(false);
  const [exportFailed, setExportFailed] = useState(false);
  useEffect(() => {
    const update = () => setState(persistenceState());
    window.addEventListener('persistence-status', update);
    return () => window.removeEventListener('persistence-status', update);
  }, []);
  if (!databaseEnabled() || (!state.pending && !state.failure)) return null;
  const language = safeStorage.getItem('language');
  const c = (key: Parameters<typeof translateInterface>[1]) => translateInterface(language === 'fr' || language === 'ar' ? language : 'en', key);
  const exportRecovery = async () => {
    setExporting(true); setExportFailed(false);
    try { await exportJsonFile('neurolift-recovery.json', await readRecoveryBundle()); }
    catch { setExportFailed(true); }
    finally { setExporting(false); }
  };
  if (!state.failure) return <div className="website-redesign" style={{ minHeight: 0 }}><div className="persistence-saving" role="status">{c('storage_saving')}</div></div>;
  return <div className="website-redesign" style={{ minHeight: 0 }}><section className="persistence-recovery" role="region" aria-label={c('storage_failed')}>
    <h2>{c('storage_failed')}</h2><p>{c('storage_recovery_help')}</p>
    <button type="button" disabled={exporting} onClick={exportRecovery}>{c('storage_export_recovery')}</button>
    {exportFailed && <p role="alert">{c('storage_export_failed')}</p>}
  </section></div>;
}
