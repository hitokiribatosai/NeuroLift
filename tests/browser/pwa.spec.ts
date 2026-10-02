import { test, expect } from '@playwright/test';
test('built app and matching media survive offline reload; APIs are not cached', async ({page, context}) => {
 const errors: string[] = [];
 page.on('pageerror', e => errors.push(e.message));
 await page.goto('/#account');
 await expect(page.getByRole('heading', {name:'Account & sync'})).toBeVisible();
 await page.evaluate(async () => { await navigator.serviceWorker.ready; });
 await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);
 await context.setOffline(true);
 await page.reload();
 await expect(page.getByRole('heading', {name:'Account & sync'})).toBeVisible();
 expect(await page.evaluate(async () => (await fetch('/exercises/Incline_Dumbbell_Press-0.jpg')).ok)).toBe(true);
 expect(await page.evaluate(async () => (await fetch('/exercises/workout-guide/nordic-hamstring-curl-1.svg')).ok)).toBe(true);
 const keys = await page.evaluate(async () => {
  const names = await caches.keys();
  const requests = await Promise.all(names.map(async n => (await caches.open(n)).keys()));
  return requests.flat().map(r => r.url);
 });
 expect(keys.some(k => k.includes('/api/'))).toBe(false);
 expect(await page.evaluate(async () => {try {await fetch('/api/auth/me/'); return false;} catch {return true;}})).toBe(true);
 expect(errors).toEqual([]);
});
