import React, { useEffect, useState } from 'react';
import { syncState } from '../../utils/sync';
import { useLanguage } from '../../contexts/LanguageContext';
export function SyncIndicator() {
 const [state, setState] = useState(syncState);
 const { language } = useLanguage();
 useEffect(() => {
  const update = () => setState(syncState());
  window.addEventListener('sync-status', update);
  return () => window.removeEventListener('sync-status', update);
 }, []);
 if (!['conflict','error','offline'].includes(state.status)) return null;
 const message = language === 'fr' ? 'Synchronisation en attente — ouvrir Compte' : language === 'ar' ? 'المزامنة معلّقة — افتح الحساب' : 'Sync needs attention — open Account';
 return <a href="#account" role="status" className="fixed bottom-24 left-4 right-4 z-50 mx-auto max-w-md rounded-xl bg-amber-100 text-amber-950 p-3 text-sm text-center shadow-lg">{message}</a>;
}
