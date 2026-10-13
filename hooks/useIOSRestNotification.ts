import { useEffect } from 'react';
import { App } from '@capacitor/app';
import { LocalNotifications } from '@capacitor/local-notifications';
import { useLanguage } from '../contexts/LanguageContext';
import { readWorkspace } from '../utils/workspace';
import { workoutNotice } from '../utils/androidWorkoutNotification';
import { createIOSRestScheduler, hasIOSRestNotifications, IOS_REST_ID, iosRestEnabled } from '../utils/iosRestNotification';

export function useIOSRestNotification() {
  const { language } = useLanguage();
  useEffect(() => {
    if (!hasIOSRestNotifications()) return;
    const schedule = createIOSRestScheduler();
    let stopped = false;
    const sync = (force = false) => {
      if (stopped) return;
      const notice = iosRestEnabled() ? workoutNotice(readWorkspace().data, language) : null;
      void schedule(notice, force).catch(() => window.dispatchEvent(new Event('ios-rest-error')));
    };
    const write = () => sync();
    const refresh = () => sync(true);
    const scope = () => { void schedule(null).then(refresh).catch(() => window.dispatchEvent(new Event('ios-rest-error'))); };
    const action = LocalNotifications.addListener('localNotificationActionPerformed', event => {
      if (event.actionId === 'tap' && event.notification.id === IOS_REST_ID) window.location.hash = 'tracker';
    });
    const resume = App.addListener('appStateChange', state => { if (state.isActive) refresh(); });
    window.addEventListener('workspace-write', write);
    window.addEventListener('workspace-scope', scope);
    window.addEventListener('ios-rest-preference', refresh);
    sync();
    return () => {
      stopped = true;
      void action.then(handle => handle.remove());
      void resume.then(handle => handle.remove());
      window.removeEventListener('workspace-write', write);
      window.removeEventListener('workspace-scope', scope);
      window.removeEventListener('ios-rest-preference', refresh);
    };
  }, [language]);
}
