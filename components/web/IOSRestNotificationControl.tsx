import React, { useEffect, useState } from 'react';
import { App } from '@capacitor/app';
import { LocalNotifications } from '@capacitor/local-notifications';
import { useLanguage } from '../../contexts/LanguageContext';
import { enableIOSRestNotifications, hasIOSRestNotifications, iosRestEnabled, setIOSRestEnabled } from '../../utils/iosRestNotification';

export function IOSRestNotificationControl() {
  const { language } = useLanguage();
  const c = (en: string, fr: string, ar: string) => language === 'fr' ? fr : language === 'ar' ? ar : en;
  const [enabled, setEnabled] = useState(iosRestEnabled);
  const [granted, setGranted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const available = hasIOSRestNotifications();
  useEffect(() => {
    if (!available) return;
    const refresh = () => {
      setEnabled(iosRestEnabled());
      void LocalNotifications.checkPermissions().then(result => setGranted(result.display === 'granted')).catch(() => setError(true));
    };
    const failed = () => setError(true);
    const resume = App.addListener('appStateChange', state => { if (state.isActive) refresh(); });
    refresh();
    window.addEventListener('ios-rest-preference', refresh);
    window.addEventListener('ios-rest-error', failed);
    return () => {
      void resume.then(handle => handle.remove());
      window.removeEventListener('ios-rest-preference', refresh);
      window.removeEventListener('ios-rest-error', failed);
    };
  }, [available]);
  if (!available) return null;
  return <aside className="web-panel" aria-label={c('Rest alerts', 'Alertes de repos', 'تنبيهات الراحة')}>
    <button className="web-secondary" aria-pressed={enabled && granted} disabled={busy} onClick={async () => {
      setBusy(true); setError(false);
      try {
        if (enabled) setIOSRestEnabled(false);
        else setGranted(await enableIOSRestNotifications());
      } catch { setError(true); } finally { setBusy(false); }
    }}>{enabled ? c('Turn off rest alerts', 'Désactiver les alertes de repos', 'إيقاف تنبيهات الراحة') : c('Enable rest alerts', 'Activer les alertes de repos', 'تفعيل تنبيهات الراحة')}</button>
    <p className="web-small">{c('Optional alert when rest finishes. Focus and iPhone notification settings may silence it.', 'Alerte facultative à la fin du repos. Concentration et les réglages iPhone peuvent la rendre silencieuse.', 'تنبيه اختياري عند انتهاء الراحة. قد يسكت وضع التركيز وإعدادات iPhone التنبيه.')}</p>
    {!granted && <p className="web-small">{c('If permission was denied, enable notifications for NeuroLift in iPhone Settings.', 'Si l’autorisation a été refusée, activez les notifications NeuroLift dans Réglages sur iPhone.', 'إذا رُفض الإذن، فعّل إشعارات NeuroLift في إعدادات iPhone.')}</p>}
    {error && <p role="status">{c('Rest alert unavailable. Your in-app timer still works.', 'Alerte indisponible. Le minuteur reste disponible.', 'تنبيه الراحة غير متاح. المؤقت داخل التطبيق يعمل.')}</p>}
  </aside>;
}
