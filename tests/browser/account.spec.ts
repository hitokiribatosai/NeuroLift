import { test, expect } from '@playwright/test';
test.use({serviceWorkers:'block'});
test('sign in pulls account data without persisting credentials and sign out restores guest', async ({page}) => {
 await page.addInitScript(() => {
  localStorage.setItem('neuroLift_workspace_guest', JSON.stringify({version:0,dirty:true,data:{neuroLift_daily_cal:'10'}}));
 });
 let calls = 0;
 await page.route('**/api/**', async route => {
  const path = new URL(route.request().url()).pathname;
  if (path.endsWith('/login/')) return route.fulfill({json:{token:'test-secret-session',user:{id:'42',email:'member@example.test',emailVerified:true}}});
  if (path.endsWith('/snapshot/')) {
   expect(route.request().headers().authorization).toBe('Bearer test-secret-session'); calls++;
   return route.fulfill({json:{version:2,data:{neuroLift_daily_cal:'200',neuroLift_hasCompletedOnboarding:'true',neuroLift_userGoal:'strength'}}});
  }
  if (path.endsWith('/logout/')) return route.fulfill({json:{message:'Signed out.'}});
  return route.fulfill({status:404,json:{error:'Unknown test route'}});
 });
 await page.goto('/#account');
 await page.getByLabel('Email', {exact:true}).fill('member@example.test');
 await page.getByLabel('Password', {exact:true}).fill('Test-password-123!');
 await page.getByRole('button',{name:'Sign in',exact:true}).click();
 await expect(page.getByText('member@example.test',{exact:true})).toBeVisible();
 await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('neuroLift_workspace_42') || '{}').version)).toBe(2);
 expect(calls).toBeGreaterThan(0);
 expect(await page.evaluate(() => JSON.stringify({...localStorage,...sessionStorage}))).not.toContain('test-secret-session');
 await page.getByRole('button',{name:'Sign out',exact:true}).click();
 await expect(page.getByRole('button',{name:'Sign in',exact:true})).toBeVisible();
 expect(await page.evaluate(() => JSON.parse(localStorage.getItem('neuroLift_workspace_guest')!).data.neuroLift_daily_cal)).toBe('10');
});
test('password recovery and signup expose delivery errors clearly', async ({page}) => {
 await page.route('**/api/**', route => route.fulfill({status:503,json:{error:'Email delivery is unavailable. Try again later.'}}));
 await page.goto('/#account');
 await page.getByLabel('Email',{exact:true}).fill('member@example.test');
 await page.getByRole('button',{name:'Forgot password'}).click();
 await expect(page.getByText('Email delivery is unavailable. Try again later.')).toBeVisible();
});
for (const width of [360, 820]) {
 test('navigation fits viewport '+width, async ({page}) => {
  await page.setViewportSize({width,height:900});
  await page.goto('/#account');
  await expect(page.getByRole('heading',{name:'Account & sync'})).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  const accountButton = page.getByRole('button',{name:'Account',exact:true}).filter({visible:true});
  await expect(accountButton).toBeVisible();
  const box = await accountButton.boundingBox();
  expect(box!.x).toBeGreaterThanOrEqual(0); expect(box!.x + box!.width).toBeLessThanOrEqual(width);
  await expect.poll(() => page.getByRole('heading',{name:'Account & sync'}).evaluate(el => getComputedStyle(el.parentElement!.parentElement!).opacity)).toBe('1');
  await page.screenshot({path:'test-results/account-'+width+'.png',fullPage:true});
 });
}
