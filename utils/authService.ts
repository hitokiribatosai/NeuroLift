import { changeScope, discardCurrentCache, scope } from './workspace';
export interface AuthUser { id: string; email: string; emailVerified: boolean }
let accessToken = '';
let currentUser: AuthUser | null = null;
const apiBase = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '');
export class ApiError extends Error { constructor(message: string, public status: number) { super(message); } }
export const accountState = () => currentUser;
export const signedIn = () => !!accessToken;
function announce() { window.dispatchEvent(new Event('account-changed')); }
export async function api<T>(path: string, method = 'GET', data?: unknown): Promise<T> {
 if (accessToken && currentUser?.id !== scope()) throw new ApiError('Account changed. Sign in again before synchronizing.', 401);
 const requestToken = accessToken;
 const response = await fetch(apiBase + path, {
  method, credentials: 'omit', cache: 'no-store', signal: AbortSignal.timeout(20000),
  headers: { ...(data !== undefined ? { 'Content-Type': 'application/json' } : {}), ...(accessToken ? { Authorization: 'Bearer ' + accessToken } : {}) },
  body: data === undefined ? undefined : JSON.stringify(data),
 });
 const result = await response.json().catch(() => ({}));
 if (!response.ok) {
  if (response.status === 401 && accessToken === requestToken) { accessToken = ''; currentUser = null; announce(); }
  throw new ApiError(result.error || 'The service is unavailable. Your local data is still saved.', response.status);
 }
 return result;
}
export const authService = {
 async signIn(email: string, password: string) {
  const result = await api<{ user: AuthUser; token: string }>('/auth/login/', 'POST', { email, password });
  accessToken = result.token; currentUser = result.user;
  changeScope(result.user.id); announce();
  return result.user;
 },
 async signUp(email: string, password: string) { return api<{message:string}>('/auth/register/', 'POST', { email, password }); },
 async signOut() {
  try { if (accessToken) await api('/auth/logout/', 'POST', {}); }
  finally { accessToken = ''; currentUser = null; changeScope('guest'); announce(); }
 },
 requestLink(flow: 'verify' | 'reset', email: string) { return api<{message:string}>('/auth/' + flow + '/request/', 'POST', { email }); },
 confirmLink(flow: 'verify' | 'reset', uid: string, token: string, password?: string) { return api<{message:string}>('/auth/' + flow + '/confirm/', 'POST', { uid, token, password }); },
 async deleteAccount(password: string) {
  await api('/account/delete/', 'POST', { password });
  accessToken = ''; currentUser = null; discardCurrentCache(); announce();
 },
};
