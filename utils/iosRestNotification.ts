import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { WorkoutNotice } from './androidWorkoutNotification';

export const IOS_REST_ID = 6201;
const preference = 'neurolift.ios-rest-notifications';
export const hasIOSRestNotifications = () => Capacitor.getPlatform() === 'ios' && Capacitor.isPluginAvailable('LocalNotifications');
export const iosRestEnabled = () => localStorage.getItem(preference) === 'true';
export function setIOSRestEnabled(enabled: boolean) {
  localStorage.setItem(preference, String(enabled));
  window.dispatchEvent(new Event('ios-rest-preference'));
}
export async function enableIOSRestNotifications() {
  const result = await LocalNotifications.requestPermissions();
  setIOSRestEnabled(result.display === 'granted');
  return result.display === 'granted';
}
export async function offerIOSRestNotifications() {
  if (!hasIOSRestNotifications() || localStorage.getItem(preference) !== null) return;
  try { await enableIOSRestNotifications(); } catch { /* The workout must remain usable. */ }
}

// Serialize native writes: rapid extend/skip/finish actions must retain their order.
// One fixed ID replaces this app's rest alert without touching other notifications.
export function createIOSRestScheduler() {
  let chain = Promise.resolve();
  let last = '';
  let deadline = 0;
  const removeDelivered = async () => {
    const delivered = await LocalNotifications.getDeliveredNotifications();
    const notifications = delivered.notifications.filter(item => item.id === IOS_REST_ID);
    if (notifications.length) await LocalNotifications.removeDeliveredNotifications({ notifications });
  };
  return (notice: WorkoutNotice | null, force = false) => {
    chain = chain.catch(() => {}).then(async () => {
      const key = JSON.stringify(notice);
      if (!force && key === last) return;
      if (!notice) {
        await LocalNotifications.cancel({ notifications: [{ id: IOS_REST_ID }] });
        await removeDelivered();
        deadline = 0;
      } else if (notice.restEnd > Date.now()) {
        const permission = await LocalNotifications.checkPermissions();
        if (permission.display !== 'granted') { last = ''; return; }
        await removeDelivered();
        await LocalNotifications.schedule({ notifications: [{
          id: IOS_REST_ID,
          title: notice.readyTitle,
          body: `${notice.title} · ${notice.body}`,
          schedule: { at: new Date(notice.restEnd) },
          sound: 'neurolift_rest_beeps.wav',
          // Suppress native foreground presentation; the existing in-app timer sounds.
          silent: true,
          extra: { kind: 'workout-rest' },
        }] });
        deadline = notice.restEnd;
      } else if (!deadline || deadline > Date.now()) {
        // Skip/cancel before expiry. Do not erase the OS alert as JS notices expiry.
        await LocalNotifications.cancel({ notifications: [{ id: IOS_REST_ID }] });
        deadline = 0;
      }
      last = key;
    });
    return chain;
  };
}
