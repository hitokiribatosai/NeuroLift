import { useCopy } from '../../hooks/useCopy';
import React, { useEffect, useState } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { AndroidWorkout, hasAndroidWorkoutNotification, notificationsEnabled, NotificationStatus, setNotificationsEnabled } from '../../utils/androidWorkoutNotification';

export function AndroidWorkoutNotificationControl() {
  const { language } = useLanguage();
  const c = useCopy();
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
  return <aside className="web-panel" aria-label={c('workout_notification')}>
    <button className="web-secondary" disabled={busy} aria-pressed={enabled && status.granted} onClick={async () => {
      setBusy(true); setError(false);
      try {
        if (enabled && status.granted) setNotificationsEnabled(false);
        else { const result = await AndroidWorkout.enable(); setStatus(result); setNotificationsEnabled(result.granted); }
      } catch { setError(true); } finally { setBusy(false); }
    }}>{enabled && status.granted ? c('turn_off_workout_notification') : c('enable_workout_notification')}</button>
    {!status.granted && <p className="web-small">{c('notifications_are_optional_your_workout_still_works_without_them')} <button className="web-text-button" onClick={() => void settings(false)}>{c('android_settings')}</button></p>}
    {enabled && status.granted && !status.exact && <p className="web-small">{c('android_may_delay_rest_alerts_while_asleep_allow_alarms_reminders_for_')} <button className="web-text-button" onClick={() => void settings(true)}>{c('timer_permissions')}</button></p>}
    {error && <p role="status">{c('notification_unavailable_your_in_app_timer_still_works')}</p>}
  </aside>;
}
