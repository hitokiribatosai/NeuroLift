import { test, expect } from '@playwright/test';
test.use({ serviceWorkers: 'block' });
const base = { neuroLift_hasCompletedOnboarding: 'true', neuroLift_userGoal: 'strength' };
const key = 'neurolift.device-tour.v1';

test('workout guide keeps selections across muscle groups', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(({ base, key }) => {
    localStorage.setItem(key, JSON.stringify({ mode: 'workout', step: 0 }));
    localStorage.setItem('neuroLift_workspace_guest', JSON.stringify({ version: 0, dirty: false, data: base }));
  }, { base, key });
  await page.goto('/#tracker');
  await page.getByRole('button', { name: 'Chest', exact: true }).click();
  await page.locator('.web-workout-picker').getByRole('button', { name: 'Back', exact: true }).click();
  await page.getByRole('button', { name: /Select Exercises/ }).click();
  await expect(page.getByRole('heading', { name: 'Add the movements you want' })).toBeVisible();
  await page.getByText('Incline Dumbbell Press', { exact: true }).click();
  await page.locator('.web-workout-picker > .web-mobile-filters').click();
  await page.getByRole('group', { name: 'Muscle group' }).getByRole('button', { name: 'Back', exact: true }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Close', exact: true }).click();
  await page.getByText('Pull-ups', { exact: true }).click();
  await expect(page.locator('.web-selection-actions').getByText('Selected exercises: 2')).toBeVisible();
  await page.getByRole('button', { name: /Start Session/ }).click();
  await expect(page.getByRole('heading', { name: 'Record a real set' })).toBeVisible();
  expect(await page.evaluate(() => JSON.parse(JSON.parse(localStorage.getItem('neuroLift_workspace_guest')!).data.neuroLift_tracker_selected_exercises))).toEqual(expect.arrayContaining(['Incline Dumbbell Press', 'Pull-ups']));
});

for (const width of [360, 820, 1440]) test(`Arabic tour fits at ${width}px with large text and reduced motion`, async ({ page }) => {
  await page.setViewportSize({ width, height: 900 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.addInitScript(({ base, key }) => {
    localStorage.setItem(key, JSON.stringify({ mode: 'overview', step: 0 }));
    localStorage.setItem('neuroLift_workspace_guest', JSON.stringify({ version: 0, dirty: false, data: { ...base, language: 'ar', neuroLift_fontSize: 'xlarge' } }));
  }, { base, key });
  await page.goto('/#home');
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
  const tour = page.locator('.web-tour');
  await expect(tour).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  for (const button of await tour.locator('button').all()) {
    const bounds = await button.boundingBox();
    expect(bounds!.height).toBeGreaterThanOrEqual(44);
    expect(bounds!.width).toBeLessThanOrEqual(width);
  }
  await page.screenshot({ path: `test-results/tour-ar-${width}.png`, fullPage: true });
});

for (const platform of ['web', 'android', 'ios']) {
  test(`${platform}: welcome, overview, Back, skip and Settings replay preserve data`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.addInitScript(({ base, platform }) => {
      if (platform === 'ios') Object.assign(window, { webkit: { messageHandlers: { bridge: {} } } });
      if (platform === 'android') Object.assign(window, { androidBridge: {} });
      if (!localStorage.getItem('neuroLift_workspace_guest')) localStorage.setItem('neuroLift_workspace_guest', JSON.stringify({ version: 0, dirty: false, data: base }));
    }, { base, platform });
    await page.goto('/#home');
    await page.getByRole('button', { name: 'Take a quick tour', exact: true }).click();
    const overview = page.getByRole('region', { name: 'App overview' });
    await expect(overview.getByRole('heading', { name: 'Welcome to NeuroLift' })).toBeVisible();
    await expect(overview.getByRole('button', { name: 'Back', exact: true })).toBeDisabled();
    await overview.getByRole('button', { name: 'Next', exact: true }).click();
    await expect(page.locator('.website-redesign').first()).toHaveAttribute('data-view', 'tracker');
    await overview.getByRole('button', { name: 'Back', exact: true }).click();
    await expect(overview.getByRole('heading', { name: 'Welcome to NeuroLift' })).toBeVisible();
    for (let i = 0; i < 4; i++) await overview.getByRole('button', { name: 'Next', exact: true }).click();
    await overview.getByRole('button', { name: 'Build your first workout' }).click();
    const guide = page.getByRole('complementary', { name: 'Workout walkthrough' });
    await expect(guide.getByText('Choose your muscle groups', { exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Chest', exact: true }).click();
    await guide.getByRole('button', { name: 'Skip guidance' }).click();
    await expect(guide).toBeHidden();
    await page.reload();
    await expect(page.getByRole('button', { name: 'Chest', exact: true })).toHaveAttribute('aria-pressed', 'true');
    await page.locator('.settings-container > button').click();
    await page.getByRole('button', { name: 'Workout walkthrough', exact: true }).click();
    await expect(guide).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    expect(await page.evaluate(() => JSON.parse(localStorage.getItem('neuroLift_workspace_guest')!).data.neuroLift_history)).toBeUndefined();
    await page.screenshot({ path: `test-results/tour-${platform}.png`, fullPage: true });
  });
}

test('guided native-mode set entry completes a real workout and resumes after reload', async ({ page, context }) => {
  await page.addInitScript(({ base, key }) => {
    Object.assign(window, { webkit: { messageHandlers: { bridge: {} } } });
    if (!localStorage.getItem('neuroLift_workspace_guest')) {
      localStorage.setItem(key, JSON.stringify({ mode: 'workout', step: 0 }));
      localStorage.setItem('neuroLift_workspace_guest', JSON.stringify({ version: 0, dirty: false, data: {
        ...base, neuroLift_tracker_phase: 'active', neuroLift_tracker_muscles: '["Chest"]',
        neuroLift_tracker_selected_exercises: '["Incline Dumbbell Press"]',
        neuroLift_tracker_active_exercises: JSON.stringify([{ name: 'Incline Dumbbell Press', sets: [{ id: 's1', weight: 0, reps: 0, completed: false }] }]),
      } }));
    }
  }, { base, key });
  await page.goto('/#tracker');
  const guide = page.getByRole('complementary', { name: 'Workout walkthrough' });
  await expect(guide.getByRole('heading', { name: 'Record a real set' })).toBeVisible();
  await page.getByLabel('KG — SET 1', { exact: true }).fill('15');
  await page.getByLabel('REPS — SET 1', { exact: true }).fill('8');
  await page.reload();
  await context.setOffline(true);
  await expect(page.getByLabel('KG — SET 1', { exact: true })).toHaveValue('15');
  await page.getByRole('button', { name: 'Done — SET 1', exact: true }).click();
  await expect(guide.getByRole('heading', { name: 'Rest, add sets, finish when ready' })).toBeVisible();
  await guide.getByRole('button', { name: 'Back', exact: true }).click();
  await expect(guide.getByRole('heading', { name: 'Record a real set' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Done — SET 1', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: /Finish Workout/ }).click();
  await page.getByRole('button', { name: 'Finish Workout', exact: true }).click();
  await expect(guide.getByRole('heading', { name: 'Your effort is saved' })).toBeVisible();
  await guide.getByRole('button', { name: 'Finish guide' }).click();
  expect(await page.evaluate(key => JSON.parse(localStorage.getItem(key)!).mode, key)).toBe('done');
  expect(await page.evaluate(() => JSON.parse(JSON.parse(localStorage.getItem('neuroLift_workspace_guest')!).data.neuroLift_history)[0].totalVolume)).toBe(120);
});

test('first-time website visitor can decline the tour without starting a workout', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Let’s get started' }).click();
  await page.locator('.web-goal-options button').first().click();
  await page.getByRole('button', { name: 'Enter your workspace' }).click();
  await page.getByRole('button', { name: 'Explore on my own' }).click();
  await page.reload();
  await expect(page.getByRole('button', { name: 'Take a quick tour' })).toBeHidden();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('neuroLift_workspace_guest')!).data.neuroLift_tracker_active_exercises)).toBeUndefined();
});
