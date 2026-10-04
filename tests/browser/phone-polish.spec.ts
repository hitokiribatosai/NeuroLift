import { test, expect } from '@playwright/test';
test.use({ serviceWorkers: 'block' });
const base = { neuroLift_hasCompletedOnboarding: 'true', neuroLift_userGoal: 'strength' };

for (const width of [360, 393, 412]) test(`phone sheet and sticky header respect ${width}px viewport and system insets`, async ({ page }) => {
  await page.setViewportSize({ width, height: 852 });
  await page.addInitScript(data => {
    document.addEventListener('DOMContentLoaded', () => {
      document.documentElement.style.setProperty('--safe-area-inset-top', '30px');
      document.documentElement.style.setProperty('--safe-area-inset-bottom', '24px');
    });
    localStorage.setItem('neuroLift_workspace_guest', JSON.stringify({ version: 0, dirty: false, data }));
  }, { ...base, neuroLift_tracker_phase: 'selection', neuroLift_tracker_muscles: '["Chest"]', neuroLift_tracker_selected_exercises: '["Incline Dumbbell Press"]' });
  await page.goto('/#home');
  await expect(page.getByText('Local workspace', { exact: true })).toHaveCount(0);
  await expect(page.getByText('Saved on this device', { exact: true })).toBeVisible();
  await page.evaluate(() => window.scrollTo(0, 600));
  const header = page.locator('.web-topbar');
  await expect.poll(async () => (await header.boundingBox())!.y).toBeCloseTo(30, 0);
  const settings = page.locator('.web-settings-nav button').first();
  await expect(page.locator('.web-settings-nav')).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
  await settings.click();
  await expect(settings).toHaveAttribute('aria-expanded', 'true');
  await page.keyboard.press('Escape');
  await page.locator('.web-navigation').getByRole('button', { name: 'Workout', exact: true }).click();
  await page.locator('.web-workout-picker > .web-mobile-filters').click();
  const dialog = page.getByRole('dialog', { name: 'Muscle group' });
  await expect(dialog).toBeVisible();
  await expect(page.locator('.web-modal-backdrop')).toHaveCSS('background-color', 'rgba(23, 36, 42, 0.4)');
  await expect.poll(() => dialog.evaluate(el => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
  const panel = await dialog.boundingBox();
  expect(panel!.x).toBeGreaterThanOrEqual(0);
  expect(panel!.x + panel!.width).toBeLessThanOrEqual(width + 1);
  for (const button of await dialog.locator('button').all()) {
    const rect = await button.boundingBox();
    expect(rect!.x).toBeGreaterThanOrEqual(0);
    expect(rect!.x + rect!.width).toBeLessThanOrEqual(width);
  }
  await dialog.getByRole('button', { name: 'Middle Chest', exact: true }).click();
  await expect(dialog.getByRole('button', { name: 'Middle Chest', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await page.screenshot({ path: `test-results/phone-sheet-${width}.png` });
  await dialog.getByRole('button', { name: 'Close', exact: true }).click();
  await page.evaluate(() => window.scrollTo(0, 650));
  const filter = page.locator('.web-workout-picker > .web-mobile-filters');
  const filterBounds = await filter.boundingBox();
  const headerBounds = await header.boundingBox();
  expect(filterBounds!.y).toBeGreaterThanOrEqual(headerBounds!.y + headerBounds!.height - 1);
});

test('session cards stay contained in dark Arabic enlarged text and reduced motion', async ({ page }) => {
  await page.setViewportSize({ width: 393, height: 852 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.addInitScript(data => {
    document.addEventListener('DOMContentLoaded', () => { document.documentElement.style.fontSize = '20px'; });
    localStorage.setItem('neuroLift_workspace_guest', JSON.stringify({ version: 0, dirty: false, data }));
  }, { ...base, neuroLift_web_theme: 'dark', language: 'ar', neuroLift_fontSize: 'xlarge', neuroLift_tracker_phase: 'active', neuroLift_tracker_active_exercises: JSON.stringify([
    { name: 'Dumbbell Flat Fly', sets: [{ id: 'a', reps: 8, weight: 5, completed: false }] },
    { name: 'Standing Cable Chest Press', sets: [{ id: 'b', reps: 8, weight: 5, completed: false }] },
  ]) });
  await page.goto('/#tracker');
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
  await expect(page.locator('.web-session-exercises')).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
  await expect(page.locator('.web-view')).toHaveCSS('animation-name', 'none');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: 'test-results/phone-session-arabic.png' });
});
