import { useCopy } from '../../hooks/useCopy';
import React, { useEffect, useState } from 'react';
import { syncState } from '../../utils/sync';
import { useLanguage } from '../../contexts/LanguageContext';
import { PwaStatus } from '../ui/PwaStatus';

export function WebStatus({ openAccount }: { openAccount: () => void }) {
  const { language } = useLanguage();
  const c = useCopy();
  const [online, setOnline] = useState(navigator.onLine);
  const [sync, setSync] = useState(syncState);
  const [local, setLocal] = useState<'idle' | 'saved' | 'error'>('idle');
  useEffect(() => {
    const network = () => setOnline(navigator.onLine);
    const update = () => setSync(syncState());
    const saved = () => setLocal('saved');
    const error = () => setLocal('error');
    window.addEventListener('online', network); window.addEventListener('offline', network);
    window.addEventListener('sync-status', update); window.addEventListener('workspace-write', saved); window.addEventListener('storage-error', error);
    return () => { window.removeEventListener('online', network); window.removeEventListener('offline', network); window.removeEventListener('sync-status', update); window.removeEventListener('workspace-write', saved); window.removeEventListener('storage-error', error); };
  }, []);
  const problem = ['error', 'conflict', 'offline'].includes(sync.status);
  const syncText = sync.status === 'syncing' ? c('syncing_account_data') : sync.status === 'saved' ? c('account_data_synced') : problem ? c('sync_needs_attention') : sync.status === 'signed-out' ? c('saved_on_this_device') : c('account_connected');
  return <div className="web-status-region"><div className="web-save-status" role="status" aria-live="polite"><span>{local === 'error' ? c('could_not_save_locally_export_a_backup') : !online ? c('offline_data_stays_on_this_device') : syncText}</span>{sync.status === 'signed-out' && online && <button onClick={openAccount}>{c('sign_in_to_sync')}</button>}{problem && <button onClick={openAccount}>{c('open_account')} ↗</button>}</div><PwaStatus /></div>;
}
