import React, { useEffect, useState } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { AndroidWorkout, hasAndroidWorkoutNotification, notificationsEnabled, NotificationStatus, setNotificationsEnabled } from '../../utils/androidWorkoutNotification';

export function AndroidWorkoutNotificationControl() {
  const { language } = useLanguage();
  const c = (en: string, fr: string, ar: string) => language === 'fr' ? fr : language === 'ar' ? ar : en;
  const [enabled, setEnabled] = useState(notificationsEnabled);
  const [status, setStatus] = useState<NotificationStatus>({ granted: false, exact: false });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const available = hasAndroidWorkoutNotification();
  useEffect(() => {
    if (!available) return;
    const refresh = () => {
      setEnabled(notificationsEnabled());
      void AndroidWorkout.status().then(setStatus).catch(() => setError(true));
    };
    refresh();
    const resume = AndroidWorkout.addListener('resume', refresh);
    window.addEventListener('workout-notification-preference', refresh);
    return () => { void resume.then(handle => handle.remove()); window.removeEventListener('workout-notification-preference', refresh); };
  }, [available]);
  if (!available) return null;
  const settings = async (exact: boolean) => {
    try { await AndroidWorkout.settings({ exact }); } catch { setError(true); }
  };
  return <aside className="web-panel" aria-label={c('Workout notification', 'Notification de séance', 'إشعار التمرين')}>
    <button className="web-secondary" disabled={busy} aria-pressed={enabled && status.granted} onClick={async () => {
      setBusy(true); setError(false);
      try {
        if (enabled && status.granted) setNotificationsEnabled(false);
        else { const result = await AndroidWorkout.enable(); setStatus(result); setNotificationsEnabled(result.granted); }
      } catch { setError(true); } finally { setBusy(false); }
    }}>{enabled && status.granted ? c('Turn off workout notification', 'Désactiver la notification', 'إيقاف إشعار التمرين') : c('Enable workout notification', 'Activer la notification', 'تفعيل إشعار التمرين')}</button>
    {!status.granted && <p className="web-small">{c('Notifications are optional. Your workout still works without them.', 'Les notifications sont facultatives. La séance fonctionne sans elles.', 'الإشعارات اختيارية. يمكنك متابعة التمرين بدونها.')} <button className="web-text-button" onClick={() => void settings(false)}>{c('Android settings', 'Réglages Android', 'إعدادات Android')}</button></p>}
    {enabled && status.granted && !status.exact && <p className="web-small">{c('Android may delay rest alerts while asleep. Allow Alarms & reminders for more precise timing.', 'Android peut retarder les alertes en veille. Autorisez Alarmes et rappels pour plus de précision.', 'قد يؤخر Android تنبيه الراحة أثناء السكون. اسمح بالمنبهات والتذكيرات لتحسين الدقة.')} <button className="web-text-button" onClick={() => void settings(true)}>{c('Timer permissions', 'Autorisations du minuteur', 'أذونات المؤقت')}</button></p>}
    {error && <p role="status">{c('Notification unavailable. Your in-app timer still works.', 'Notification indisponible. Le minuteur reste disponible.', 'الإشعار غير متاح. المؤقت داخل التطبيق يعمل.')}</p>}
  </aside>;
}
