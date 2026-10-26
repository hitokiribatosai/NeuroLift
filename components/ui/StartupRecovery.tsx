import React, { useEffect, useState } from 'react';
import { readRecoveryBundle, reconciliationOptions, reconcileWorkspace } from '../../utils/workspace';
import { exportJsonFile } from '../../utils/exportFile';
import { translateInterface } from '../../utils/interfaceCopy';
import './persistence.css';

/** No workspace providers are mounted until storage initialization succeeds. */
export function StartupRecovery({ retry }: { retry: () => Promise<void> }) {
  const [busy, setBusy] = useState(false);
  const [exportFailed, setExportFailed] = useState(false);
  const [options, setOptions] = useState<Awaited<ReturnType<typeof reconciliationOptions>>>(null);
  const [recoveryFailed, setRecoveryFailed] = useState(false);
  const [exported, setExported] = useState(false);
  useEffect(() => {
    let mounted = true;
    void reconciliationOptions().then(value => { if (mounted) setOptions(value); }).catch(() => undefined);
    return () => { mounted = false; };
  }, []);
  const language = navigator.language.startsWith('fr') ? 'fr' : navigator.language.startsWith('ar') ? 'ar' : 'en';
  const c = (key: Parameters<typeof translateInterface>[1]) => translateInterface(language, key);
  const exportRecovery = async () => {
    setBusy(true); setExportFailed(false);
    try { await exportJsonFile('neurolift-startup-recovery.json', await readRecoveryBundle()); setExported(true); }
    catch { setExportFailed(true); }
    finally { setBusy(false); }
  };
  const choose = async (choice: 'database' | 'legacy') => {
    if (!options || !exported) return;
    setBusy(true); setRecoveryFailed(false);
    try { await reconcileWorkspace(options, choice); await retry(); }
    catch { setRecoveryFailed(true); }
    finally { setBusy(false); }
  };
  return <main className="website-redesign" dir={language === 'ar' ? 'rtl' : 'ltr'}>
    <section className="persistence-recovery" aria-label={c('storage_startup_failed')}>
      <h1>{c('storage_startup_failed')}</h1><p>{c('storage_startup_help')}</p>
      <button disabled={busy} onClick={exportRecovery}>{c('storage_export_recovery')}</button>{' '}
      <button disabled={busy} onClick={async () => { setBusy(true); try { await retry(); } finally { setBusy(false); } }}>{c('storage_retry')}</button>
      {exportFailed && <p role="alert">{c('storage_export_failed')}</p>}
      {options && <section aria-label={c('storage_choose_copy')}>
        <h2>{c('storage_choose_copy')}</h2><p>{c('storage_choose_help')}</p>
        <button disabled={busy || !exported} onClick={() => choose('database')}>{c('storage_keep_database')}</button>{' '}
        <button disabled={busy || !exported} onClick={() => choose('legacy')}>{c('storage_use_legacy')}</button>
      </section>}
      {recoveryFailed && <p role="alert">{c('storage_reconcile_failed')}</p>}
    </section>
  </main>;
}
