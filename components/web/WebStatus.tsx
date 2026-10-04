import React, { useEffect, useState } from 'react';
import { syncState } from '../../utils/sync';
import { useLanguage } from '../../contexts/LanguageContext';
import { PwaStatus } from '../ui/PwaStatus';

export function WebStatus({ openAccount }: { openAccount: () => void }) {
  const { language } = useLanguage();
  const c = (en: string, fr: string, ar: string) => language === 'fr' ? fr : language === 'ar' ? ar : en;
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
  const syncText = sync.status === 'syncing' ? c('Syncing account data…', 'Synchronisation du compte…', 'مزامنة بيانات الحساب…') : sync.status === 'saved' ? c('Account data synced', 'Données du compte synchronisées', 'تمت مزامنة بيانات الحساب') : problem ? c('Sync needs attention', 'Synchronisation à vérifier', 'المزامنة تحتاج مراجعة') : sync.status === 'signed-out' ? c('Saved on this device', 'Enregistré sur cet appareil', 'محفوظ على هذا الجهاز') : c('Account connected', 'Compte connecté', 'الحساب متصل');
  return <div className="web-status-region"><div className="web-save-status" role="status" aria-live="polite"><span>{local === 'error' ? c('Could not save locally. Export a backup.', 'Échec de sauvegarde locale. Exportez une copie.', 'تعذر الحفظ محلياً. صدّر نسخة احتياطية.') : !online ? c('Offline · data stays on this device', 'Hors ligne · données sur cet appareil', 'غير متصل · البيانات على هذا الجهاز') : syncText}</span>{sync.status === 'signed-out' && online && <button onClick={openAccount}>{c('Sign in to sync', 'Se connecter pour synchroniser', 'سجّل الدخول للمزامنة')}</button>}{problem && <button onClick={openAccount}>{c('Open Account', 'Ouvrir le compte', 'افتح الحساب')} ↗</button>}</div><PwaStatus /></div>;
}
