import React, { useEffect, useState } from 'react';
export function PwaStatus() {
 const [update, setUpdate] = useState<ServiceWorkerRegistration | null>(null);
 const [failed, setFailed] = useState(false);
 useEffect(() => {
  const found = (e: Event) => setUpdate((e as CustomEvent<ServiceWorkerRegistration>).detail);
  const error = () => setFailed(true);
  window.addEventListener('pwa-update', found); window.addEventListener('pwa-unavailable', error);
  return () => {window.removeEventListener('pwa-update', found); window.removeEventListener('pwa-unavailable', error);};
 }, []);
 if (failed) return <p className="fixed top-20 left-4 right-4 z-40 bg-amber-100 text-amber-950 p-2 text-center text-sm" role="status">Offline app download failed. Reconnect and reload to try again.</p>;
 if (!update) return null;
 return <button className="fixed top-20 left-4 right-4 z-40 bg-teal-100 text-teal-950 p-2 text-sm rounded-lg" onClick={() => {
  navigator.serviceWorker.addEventListener('controllerchange', () => window.location.reload(), {once:true});
  update.waiting?.postMessage('ACTIVATE_UPDATE');
 }}>Update ready — save any open form, then tap to reload</button>;
}
