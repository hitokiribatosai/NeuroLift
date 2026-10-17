import { useCopy } from '../../hooks/useCopy';
import React, { useEffect, useState } from 'react';
import { App } from '@capacitor/app';
import { LocalNotifications } from '@capacitor/local-notifications';
import { useLanguage } from '../../contexts/LanguageContext';
import { enableIOSRestNotifications, hasIOSRestNotifications, iosRestEnabled, setIOSRestEnabled } from '../../utils/iosRestNotification';

export function IOSRestNotificationControl() {
  const { language } = useLanguage();
  const c = useCopy();
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
  return <aside className="web-panel" aria-label={c('rest_alerts')}>
    <button className="web-secondary" aria-pressed={enabled && granted} disabled={busy} onClick={async () => {
      setBusy(true); setError(false);
      try {
        if (enabled) setIOSRestEnabled(false);
        else setGranted(await enableIOSRestNotifications());
      } catch { setError(true); } finally { setBusy(false); }
    }}>{enabled ? c('turn_off_rest_alerts') : c('enable_rest_alerts')}</button>
    <p className="web-small">{c('optional_alert_when_rest_finishes_focus_and_iphone_notification_settin')}</p>
    {!granted && <p className="web-small">{c('if_permission_was_denied_enable_notifications_for_neurolift_in_iphone_')}</p>}
    {error && <p role="status">{c('rest_alert_unavailable_your_in_app_timer_still_works')}</p>}
  </aside>;
}
