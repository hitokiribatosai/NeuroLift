import { test, expect } from '@playwright/test';

test.use({ serviceWorkers: 'block' });
const base = { neuroLift_hasCompletedOnboarding: 'true', neuroLift_userGoal: 'strength' };
for (const width of [360, 390, 768, 900, 1440]) {
  test(`navigation stays reachable after scrolling at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    await page.addInitScript(data => localStorage.setItem('neuroLift_workspace_guest', JSON.stringify({ version: 0, dirty: false, data })), base);
    await page.goto('/#planner');
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    const navigation = page.getByRole('navigation', { name: 'Main navigation' });
    const bounds = await navigation.boundingBox();
    expect(bounds!.y).toBeGreaterThanOrEqual(0);
    expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(845);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await navigation.getByRole('button', { name: 'Home', exact: true }).click();
    await expect(page.locator('.web-dashboard')).toBeVisible();
    await page.screenshot({ path: `test-results/platform-home-${width}.png`, fullPage: true });
  });
}

test('library search and scroll survive navigation and browser Back', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(data => localStorage.setItem('neuroLift_workspace_guest', JSON.stringify({ version: 0, dirty: false, data })), base);
  await page.goto('/#planner');
  const search = page.locator('.web-library-toolbar input');
  await search.fill('press');
  await page.evaluate(() => window.scrollTo(0, 500));
  await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(400);
  await page.locator('.web-navigation').getByRole('button', { name: 'Home', exact: true }).click();
  await page.goBack();
  await expect(search).toHaveValue('press');
  await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(400);
  await page.goForward();
  await expect(page.locator('.web-dashboard')).toBeVisible();
});

test('phone library filters open as a sheet and preserve muscle choice', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(data => localStorage.setItem('neuroLift_workspace_guest', JSON.stringify({ version: 0, dirty: false, data })), base);
  await page.goto('/#planner');
  await page.locator('.web-library-toolbar .web-mobile-filters').click();
  const sheet = page.getByRole('dialog');
  await expect(sheet).toBeVisible();
  await sheet.getByRole('button', { name: 'Back', exact: true }).click();
  await sheet.getByRole('button', { name: 'Show exercises', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Back', exact: true })).toBeVisible();
  await page.locator('.web-navigation').getByRole('button', { name: 'Home', exact: true }).click();
  await page.locator('.web-navigation').getByRole('button', { name: 'Exercises', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Back', exact: true })).toBeVisible();
});

for (const width of [390, 1440]) test(`selection review and preserved workout at ${width}px`, async ({ page }) => {
  await page.setViewportSize({ width, height: 844 });
  await page.addInitScript(data => localStorage.setItem('neuroLift_workspace_guest', JSON.stringify({ version: 0, dirty: false, data })), {
    ...base, neuroLift_tracker_phase: 'selection', neuroLift_tracker_muscles: '["Chest"]', neuroLift_tracker_selected_exercises: '["Incline Dumbbell Press"]',
  });
  await page.goto('/#tracker');
  await page.evaluate(() => window.scrollTo(0, 600));
  if (width < 801) {
    const bar = await page.locator('.web-selection-actions').boundingBox();
    const nav = await page.locator('.web-sidebar').boundingBox();
    expect(bar!.y + bar!.height).toBeLessThanOrEqual(nav!.y);
    expect(bar!.y).toBeGreaterThanOrEqual(0);
  } else await expect(page.locator('.web-selection-panel')).toBeVisible();
  await page.locator('.web-selection-actions').getByRole('button', { name: 'Review', exact: true }).click();
  await expect(page.getByRole('dialog').getByText('Incline Dumbbell Press', { exact: true })).toBeVisible();
  await page.keyboard.press('Escape');
  await page.locator('.web-navigation').getByRole('button', { name: 'Home', exact: true }).click();
  await page.locator('.web-navigation').getByRole('button', { name: 'Workout', exact: true }).click();
  await page.locator('.web-selection-actions').getByRole('button', { name: 'Review', exact: true }).click();
  await expect(page.getByRole('dialog').getByText('Incline Dumbbell Press', { exact: true })).toBeVisible();
});

test('active workout survives leaving and resuming without resetting sets or phase', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(data => localStorage.setItem('neuroLift_workspace_guest', JSON.stringify({ version: 0, dirty: false, data })), {
    ...base, neuroLift_tracker_phase: 'active', neuroLift_tracker_selected_exercises: '["Pull-ups"]',
    neuroLift_tracker_active_exercises: JSON.stringify([{ name: 'Pull-ups', sets: [{ id: 's1', reps: 8, weight: 0, completed: false }] }]),
  });
  await page.goto('/#tracker');
  await page.getByLabel('REPS — SET 1', { exact: true }).fill('12');
  await page.locator('.web-navigation').getByRole('button', { name: 'Home', exact: true }).click();
  await page.locator('.web-resume-strip').click();
  await expect(page.getByLabel('REPS — SET 1', { exact: true })).toHaveValue('12');
  await expect(page.locator('.web-session')).toBeVisible();
});
