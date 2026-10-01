import { Capacitor } from '@capacitor/core';
export async function registerServiceWorker() {
 if (!('serviceWorker' in navigator) || Capacitor.isNativePlatform()) return;
 if (!import.meta.env.PROD) {
  const registrations = await navigator.serviceWorker.getRegistrations();
  for (const r of registrations) {
   const worker = r.active || r.waiting || r.installing;
   if (worker && new URL(worker.scriptURL).pathname === '/sw.js') await r.unregister();
  }
  return;
 }
 try {
  const registration = await navigator.serviceWorker.register('/sw.js', {updateViaCache:'none'});
  const announce = () => window.dispatchEvent(new CustomEvent('pwa-update', {detail:registration}));
  if (registration.waiting) announce();
  registration.addEventListener('updatefound', () => {
   const worker = registration.installing;
   worker?.addEventListener('statechange', () => {
    if (worker.state === 'installed' && navigator.serviceWorker.controller) announce();
    if (worker.state === 'redundant' && !registration.active) window.dispatchEvent(new Event('pwa-unavailable'));
   });
  });
  await navigator.serviceWorker.ready;
  window.dispatchEvent(new Event('pwa-ready'));
 } catch {
  window.dispatchEvent(new Event('pwa-unavailable'));
 }
}
