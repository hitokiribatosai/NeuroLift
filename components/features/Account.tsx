import React, { useEffect, useState } from 'react';
import { accountState, authService } from '../../utils/authService';
import { syncNow, syncState } from '../../utils/sync';
import { changeScope, scope, readWorkspace } from '../../utils/workspace';
import { DataManager } from '../../utils/dataManager';
import { useLanguage } from '../../contexts/LanguageContext';

const copy = {
 en: { account:'Account & sync', login:'Sign in', signup:'Create account', email:'Email', password:'Password', verify:'Resend verification', forgot:'Forgot password', confirm:'Confirm', reset:'Set new password', sync:'Sync now', logout:'Sign out', export:'Export backup', remove:'Delete account', local:'Keep this device’s data', remote:'Use server data', conflict:'Both devices changed data. Export a backup, then choose which version to keep. A recovery copy is also saved on this device.', guest:'Continue with guest data', cache:'Saved on this device. Sign in to sync. Account sessions end when the app closes.', deleteNote:'Delete your account and all server data? Enter your password to confirm. Other devices may retain offline copies.', notice:'Use at least 10 characters for a new password. Check your inbox after registration.', credentials:'Passwords and session tokens are never included in data backups.' },
 fr: { account:'Compte et synchronisation', login:'Connexion', signup:'Créer un compte', email:'E-mail', password:'Mot de passe', verify:'Renvoyer la vérification', forgot:'Mot de passe oublié', confirm:'Confirmer', reset:'Nouveau mot de passe', sync:'Synchroniser', logout:'Déconnexion', export:'Exporter', remove:'Supprimer le compte', local:'Garder les données locales', remote:'Utiliser les données du serveur', conflict:'Les deux appareils ont changé. Exportez une sauvegarde puis choisissez une version. Une copie de récupération est conservée.', guest:'Continuer comme invité', cache:'Données locales disponibles. Connectez-vous pour synchroniser. La session se termine à la fermeture.', deleteNote:'Supprimer le compte et les données du serveur ? Confirmez avec votre mot de passe. Des copies locales peuvent subsister.', notice:'Utilisez au moins 10 caractères. Vérifiez votre messagerie après inscription.', credentials:'Les sauvegardes ne contiennent ni mot de passe ni jeton de session.' },
 ar: { account:'الحساب والمزامنة', login:'تسجيل الدخول', signup:'إنشاء حساب', email:'البريد الإلكتروني', password:'كلمة المرور', verify:'إعادة إرسال التحقق', forgot:'نسيت كلمة المرور', confirm:'تأكيد', reset:'كلمة مرور جديدة', sync:'مزامنة الآن', logout:'تسجيل الخروج', export:'تصدير نسخة', remove:'حذف الحساب', local:'الاحتفاظ ببيانات هذا الجهاز', remote:'استخدام بيانات الخادم', conflict:'تغيرت البيانات على الجهازين. صدّر نسخة ثم اختر البيانات المطلوبة. تُحفظ نسخة للاستعادة على هذا الجهاز.', guest:'متابعة كضيف', cache:'البيانات محفوظة محلياً. سجل الدخول للمزامنة. تنتهي الجلسة عند إغلاق التطبيق.', deleteNote:'حذف الحساب وجميع بيانات الخادم؟ أدخل كلمة المرور للتأكيد. قد تبقى نسخ محلية على الأجهزة الأخرى.', notice:'استخدم 10 أحرف على الأقل وتحقق من بريدك بعد التسجيل.', credentials:'لا تتضمن النسخ كلمات المرور أو رموز الجلسة.' },
};
export function Account() {
 const { language } = useLanguage(), c = copy[language];
 const [user, setUser] = useState(accountState), [sync, setSync] = useState(syncState);
 const [mode, setMode] = useState<'login'|'signup'>('login');
 const [email, setEmail] = useState(''), [password, setPassword] = useState('');
 const [message, setMessage] = useState(''), [busy, setBusy] = useState(false), [deleting, setDeleting] = useState(false);
 const [link, setLink] = useState(() => new URLSearchParams(window.location.hash.split('?')[1] || ''));
 useEffect(() => {
  const account = () => setUser(accountState()), status = () => setSync(syncState());
  window.addEventListener('account-changed', account); window.addEventListener('sync-status', status);
  if (accountState()) void syncNow();
  return () => { window.removeEventListener('account-changed', account); window.removeEventListener('sync-status', status); };
 }, []);
 async function run(action: () => Promise<unknown>) {
  setBusy(true); setMessage('');
  try { const result = await action() as {message?:string} | undefined; setMessage(result?.message || 'Done.'); }
  catch(e) { setMessage(e instanceof Error ? e.message : 'Please try again.'); }
  finally { setBusy(false); setPassword(''); }
 }
 const flow = link.get('flow');
 const fieldClass = 'w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-3';
 const buttonClass = 'rounded-xl border border-zinc-300 dark:border-zinc-700 px-4 py-3 disabled:opacity-50';
 return <section className="mx-auto max-w-xl px-6 py-8 space-y-5">
  <h1 className="text-3xl font-bold">{c.account}</h1>
  <p className="text-sm text-zinc-500">{c.cache}</p>
  {(flow === 'verify' || flow === 'reset') && <form className="space-y-3" onSubmit={e => { e.preventDefault(); void run(async () => {
   const result = await authService.confirmLink(flow, link.get('uid') || '', link.get('token') || '', password);
   window.history.replaceState(null, '', '/#account'); setLink(new URLSearchParams()); return result;
  }); }}>
   {flow === 'reset' && <label className="block">{c.reset}<input className={fieldClass} type="password" required minLength={10} maxLength={256} autoComplete="new-password" value={password} onChange={e => setPassword(e.target.value)} /></label>}
   <button className={buttonClass} disabled={busy}>{c.confirm}</button>
  </form>}
  {user ? <>
   <p>{user.email}</p>
   <p role="status">Sync: {sync.status}{readWorkspace().dirty ? ' · pending changes' : ''}</p>
   {sync.problem && <p role="alert" className="text-rose-600">{sync.problem}</p>}
   <div className="flex flex-wrap gap-3">
    <button className={buttonClass} disabled={busy || sync.status === 'syncing'} onClick={() => void syncNow()}>{c.sync}</button>
    <button className={buttonClass} disabled={busy} onClick={() => void run(() => authService.signOut())}>{c.logout}</button>
   </div>
   {sync.status === 'conflict' && <div className="border border-amber-500 rounded-xl p-4 space-y-3"><p>{c.conflict}</p>
    <button className={buttonClass} onClick={() => void syncNow('local')}>{c.local}</button>{' '}
    <button className={buttonClass} onClick={() => void syncNow('remote')}>{c.remote}</button>
   </div>}
   <button className="text-rose-600 underline" onClick={() => setDeleting(d => !d)}>{c.remove}</button>
   {deleting && <form className="space-y-3" onSubmit={e => {e.preventDefault(); void run(() => authService.deleteAccount(password));}}>
    <p>{c.deleteNote}</p>
    <label className="block">{c.password}<input className={fieldClass} type="password" required autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} /></label>
    <button className={buttonClass} disabled={busy}>{c.remove}</button>
   </form>}
  </> : <form className="space-y-4" onSubmit={e => {e.preventDefault(); void run(async () => {
   if (mode === 'signup') return authService.signUp(email, password);
   await authService.signIn(email, password); await syncNow();
  });}}>
   <label className="block">{c.email}<input className={fieldClass} type="email" required autoComplete="email" maxLength={254} value={email} onChange={e => setEmail(e.target.value)} /></label>
   <label className="block">{c.password}<input className={fieldClass} type="password" required minLength={mode === 'signup' ? 10 : 1} maxLength={256} autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} value={password} onChange={e => setPassword(e.target.value)} /></label>
   <p className="text-sm text-zinc-500">{c.notice}</p>
   <div className="flex flex-wrap gap-3">
    <button className={buttonClass} disabled={busy}>{mode === 'login' ? c.login : c.signup}</button>
    <button className={buttonClass} type="button" onClick={() => setMode(m => m === 'login' ? 'signup' : 'login')}>{mode === 'login' ? c.signup : c.login}</button>
    <button type="button" className={buttonClass} disabled={busy || !email} onClick={() => void run(() => authService.requestLink('reset', email))}>{c.forgot}</button>
    <button type="button" className={buttonClass} disabled={busy || !email} onClick={() => void run(() => authService.requestLink('verify', email))}>{c.verify}</button>
   </div>
  </form>}
  <p role="status" className="text-sm whitespace-pre-wrap">{message}</p>
  <button className={buttonClass} onClick={() => void run(async () => {if (!(await DataManager.exportData())) throw new Error('Export failed.');})}>{c.export}</button>
  {!user && scope() !== 'guest' && <button className={buttonClass} onClick={() => changeScope('guest')}>{c.guest}</button>}
  <p className="text-xs text-zinc-500">{c.credentials}</p>
  <p className="text-sm">Guest data remains separate. To move it to an account, export it while in guest mode, then sign in and import from Settings.</p>
 </section>;
}
