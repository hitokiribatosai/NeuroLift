import React, { useState } from 'react';
import { readRecoveryBundle } from '../../utils/workspace';
import { exportJsonFile } from '../../utils/exportFile';
import { translateInterface } from '../../utils/interfaceCopy';
import './persistence.css';

/** No workspace providers are mounted until storage initialization succeeds. */
export function StartupRecovery({ retry }: { retry: () => Promise<void> }) {
  const [busy, setBusy] = useState(false);
  const [exportFailed, setExportFailed] = useState(false);
  const language = navigator.language.startsWith('fr') ? 'fr' : navigator.language.startsWith('ar') ? 'ar' : 'en';
  const c = (key: Parameters<typeof translateInterface>[1]) => translateInterface(language, key);
  const exportRecovery = async () => {
    setBusy(true); setExportFailed(false);
    try { await exportJsonFile('neurolift-startup-recovery.json', await readRecoveryBundle()); }
    catch { setExportFailed(true); }
    finally { setBusy(false); }
  };
  return <main className="website-redesign" dir={language === 'ar' ? 'rtl' : 'ltr'}>
    <section className="persistence-recovery" aria-label={c('storage_startup_failed')}>
      <h1>{c('storage_startup_failed')}</h1><p>{c('storage_startup_help')}</p>
      <button disabled={busy} onClick={exportRecovery}>{c('storage_export_recovery')}</button>{' '}
      <button disabled={busy} onClick={async () => { setBusy(true); try { await retry(); } finally { setBusy(false); } }}>{c('storage_retry')}</button>
      {exportFailed && <p role="alert">{c('storage_export_failed')}</p>}
    </section>
  </main>;
}
