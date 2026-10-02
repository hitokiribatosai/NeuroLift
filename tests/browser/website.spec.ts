import { test, expect } from '@playwright/test';

test.use({ serviceWorkers: 'block' });
const data = { neuroLift_hasCompletedOnboarding: 'true', neuroLift_userGoal: 'strength' };
for (const width of [390, 1440]) {
  test(`website sections fit and render at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.addInitScript(seed => localStorage.setItem('neuroLift_workspace_guest', JSON.stringify({ version: 0, dirty: false, data: seed })), data);
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    for (const view of ['home', 'planner', 'tracker', 'journal', 'clock', 'nutrition', 'account', 'privacy']) {
      await page.goto('/?review=' + view + '#' + view);
      await expect(page.locator('.website-redesign')).toHaveAttribute('data-view', view);
      await expect(page.locator('main')).toBeVisible();
      await expect.poll(() => page.locator('.web-surface > div').evaluate(el => getComputedStyle(el).opacity)).toBe('1');
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      await page.locator('img').evaluateAll(images => images.forEach(img => { if (img instanceof HTMLImageElement) img.loading = 'eager'; }));
      await expect.poll(() => page.locator('img').evaluateAll(images => images.every(img => img instanceof HTMLImageElement && img.complete && img.naturalWidth > 0))).toBe(true);
      await page.screenshot({ path: `test-results/web-${view}-${width}.png`, fullPage: true });
    }
    expect(errors).toEqual([]);
  });
}

test('website onboarding chooses a goal without losing local data', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Let’s get started' }).click();
  await page.locator('.web-goal-options button').first().click();
  await page.getByRole('button', { name: 'Enter your workspace' }).click();
  await expect(page.locator('.web-dashboard')).toBeVisible();
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('neuroLift_workspace_guest')!).data);
  expect(stored.neuroLift_hasCompletedOnboarding).toBe('true');
  expect(stored.neuroLift_userGoal).toBe('strength');
});

test('website theme stays independent of the native preference', async ({ page }) => {
  await page.addInitScript(seed => localStorage.setItem('neuroLift_workspace_guest', JSON.stringify({ version: 0, dirty: false, data: { ...seed, neuroLift_theme: 'light', neuroLift_web_theme: 'dark' } })), data);
  await page.goto('/#home');
  await expect(page.locator('html')).toHaveClass(/dark/);
  await expect(page.locator('.web-dashboard')).toBeVisible();
  await expect.poll(() => page.locator('.web-surface > div').evaluate(el => getComputedStyle(el).opacity)).toBe('1');
  await page.screenshot({ path: 'test-results/web-home-dark.png', fullPage: true });
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('neuroLift_workspace_guest')!).data.neuroLift_theme)).toBe('light');
});

for (const platform of ['android', 'ios']) test(`${platform} runtime retains the previous screen and native theme`, async ({ page }) => {
  await page.addInitScript(({ seed, platform }) => {
    Object.assign(window, platform === 'android' ? { androidBridge: {} } : { webkit: { messageHandlers: { bridge: {} } } });
    localStorage.setItem('neuroLift_workspace_guest', JSON.stringify({ version: 0, dirty: false, data: { ...seed, neuroLift_theme: 'dark', neuroLift_web_theme: 'light' } }));
  }, { seed: data, platform });
  await page.goto('/#home');
  await expect(page.locator('.website-redesign')).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Train with purpose.' })).toBeVisible();
  await expect(page.locator('html')).toHaveClass(/dark/);
});

test('dashboard shortcuts open the corresponding muscle group', async ({ page }) => {
  await page.addInitScript(seed => localStorage.setItem('neuroLift_workspace_guest', JSON.stringify({ version: 0, dirty: false, data: seed })), data);
  await page.goto('/#home');
  await page.getByRole('button', { name: 'Pull', exact: true }).click();
  await expect(page).toHaveURL(/#planner\?muscle=Back$/);
  await expect(page.getByRole('heading', { name: 'Back', exact: true })).toBeVisible();
  await expect(page.getByText('Pull-ups', { exact: true }).first()).toBeVisible();
});
