import { test, expect } from '@playwright/test';
test.use({ serviceWorkers: 'block' });
for (const platform of ['web', 'android']) for (const theme of ['light', 'dark']) {
 test(`${platform} ${theme} settings, navigation and account hierarchy`, async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.addInitScript(({ platform, theme }) => {
   if (platform === 'android') Object.assign(window, { androidBridge: {} });
   localStorage.setItem('neuroLift_workspace_guest', JSON.stringify({ version: 0, dirty: false, data: {
    neuroLift_hasCompletedOnboarding: 'true', neuroLift_userGoal: 'strength',
    neuroLift_web_theme: theme, neuroLift_theme: theme, neuroLift_fontSize: 'xlarge',
   } }));
  }, { platform, theme });
  await page.goto('/#account');
  await expect(page.locator('html')).toHaveClass(new RegExp(theme));
  for (const label of await page.locator('.web-navigation button:visible > span:not(.web-nav-arrow)').all()) {
   expect(await label.evaluate(el => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
   await expect(label).toHaveCSS('white-space', 'nowrap');
  }
  const primary = page.locator('.account-primary');
  await expect(primary).toHaveText('Sign in');
  await expect(primary).toHaveCSS('color', 'rgb(23, 36, 42)');
  await expect(primary).toHaveCSS('background-color', 'rgb(215, 247, 107)');
  await page.getByRole('button', { name: 'Create account', exact: true }).click();
  await expect(primary).toHaveText('Create account');
  await page.getByRole('button', { name: 'Settings', exact: true }).click();
  await expect(page.locator('.settings-container > div')).toHaveCSS('opacity', '1');
  const selected = page.locator('.web-settings-nav button[aria-pressed="true"]');
  expect(await selected.count()).toBe(4);
  for (const button of await selected.all()) {
   await expect(button).toHaveCSS('background-color', 'rgb(215, 247, 107)');
   await expect(button).toHaveCSS('color', 'rgb(23, 36, 42)');
  }
  await expect(page.locator('html')).toHaveCSS('scrollbar-color', 'rgb(132, 145, 138) rgba(0, 0, 0, 0)');
  await page.screenshot({ path: `test-results/theme-polish-${platform}-${theme}.png` });
 });
}
