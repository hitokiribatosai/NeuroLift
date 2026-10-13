import { useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { readWorkspace } from '../utils/workspace';
import { AndroidWorkout, hasAndroidWorkoutNotification, notificationsEnabled, workoutNotice } from '../utils/androidWorkoutNotification';

// Keep the native card in sync even while another app section is open.
export function useAndroidWorkoutNotification() {
  const { language } = useLanguage();
  useEffect(() => {
    if (!hasAndroidWorkoutNotification()) return;
    let stopped = false, queued = false, last = '';
    let chain = Promise.resolve();
    const sync = () => {
      if (queued || stopped) return;
      queued = true;
      queueMicrotask(() => {
        queued = false;
        chain = chain.then(async () => {
          if (stopped) return;
          const notice = notificationsEnabled() ? workoutNotice(readWorkspace().data, language) : null;
          const key = JSON.stringify(notice);
          if (key === last) return;
          if (notice) await AndroidWorkout.update(notice);
          else await AndroidWorkout.clear();
          last = key;
        }).catch(() => { last = ''; /* Notification errors must never prevent saving a workout. */ });
      });
    };
    const refresh = () => { last = ''; sync(); };
    const open = AndroidWorkout.addListener('openWorkout', () => { window.location.hash = 'tracker'; });
    const resume = AndroidWorkout.addListener('resume', refresh);
    window.addEventListener('workspace-write', sync);
    window.addEventListener('workout-notification-preference', refresh);
    window.addEventListener('workspace-scope', refresh);
    sync();
    return () => {
      stopped = true;
      void open.then(handle => handle.remove());
      void resume.then(handle => handle.remove());
      window.removeEventListener('workspace-write', sync);
      window.removeEventListener('workout-notification-preference', refresh);
      window.removeEventListener('workspace-scope', refresh);
    };
  }, [language]);
}
