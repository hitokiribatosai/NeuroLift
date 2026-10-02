import { test, expect } from '@playwright/test';
const base = { neuroLift_hasCompletedOnboarding: 'true', neuroLift_userGoal: 'strength' };
const exercises = [{ name: 'Incline Dumbbell Press', sets: [{ id: 's1', weight: 0, reps: 0, completed: false }, { id: 's2', weight: 0, reps: 0, completed: false }] }];
const active = { ...base, neuroLift_tracker_phase: 'active', neuroLift_tracker_selected_exercises: JSON.stringify(exercises.map(e => e.name)), neuroLift_tracker_muscles: '["Chest"]', neuroLift_tracker_active_exercises: JSON.stringify(exercises) };
test.use({ serviceWorkers: 'block' });

test('log sets, reload, finish, and find the saved workout in the journal', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(data => { if (!localStorage.getItem('neuroLift_workspace_guest')) localStorage.setItem('neuroLift_workspace_guest', JSON.stringify({ version: 0, dirty: false, data })); }, active);
  await page.goto('/#tracker');
  await page.getByLabel('KG — SET 1', { exact: true }).fill('20');
  await page.getByLabel('REPS — SET 1', { exact: true }).fill('10');
  await page.getByRole('button', { name: 'Done — SET 1', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Skip Rest', exact: true })).toBeVisible();
  await page.getByLabel('REPS — SET 2', { exact: true }).fill('8');
  await expect(page.getByText('Saved on this device', { exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: 'test-results/refined-session-mobile.png', fullPage: true });
  await page.reload();
  await expect(page.getByLabel('KG — SET 1', { exact: true })).toHaveValue('20');
  await expect(page.getByRole('button', { name: 'Done — SET 1', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: /Finish Workout/ }).click();
  await page.getByRole('button', { name: 'Finish Workout', exact: true }).click();
  await expect.poll(() => page.evaluate(() => JSON.parse(JSON.parse(localStorage.getItem('neuroLift_workspace_guest')!).data.neuroLift_history)[0].totalVolume)).toBe(200);
  await page.locator('.web-navigation').getByRole('button', { name: 'Journal', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Training journal' })).toBeVisible();
  await expect(page.getByText('Incline Dumbbell Press', { exact: true }).first()).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Add entry', exact: true })).toBeHidden();
  await page.getByRole('button', { name: 'Body Metrics', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Add entry', exact: true })).toBeVisible();
  await page.getByLabel('Weight (kg)', { exact: true }).fill('75');
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await expect.poll(() => page.evaluate(() => JSON.parse(JSON.parse(localStorage.getItem('neuroLift_workspace_guest')!).data.neuroLift_journal)[0].weight)).toBe(75);
});

test('mobile More menu exposes secondary destinations and closes on selection', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(data => localStorage.setItem('neuroLift_workspace_guest', JSON.stringify({ version: 0, dirty: false, data })), base);
  await page.goto('/#home');
  const nav = page.locator('.web-navigation');
  await expect(nav.getByRole('button', { name: 'Account', exact: true })).toBeHidden();
  await nav.getByRole('button', { name: 'More', exact: true }).click();
  await nav.getByRole('button', { name: 'Account', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Account & sync' })).toBeVisible();
  await expect(nav.getByRole('button', { name: 'More', exact: true })).toHaveAttribute('aria-expanded', 'false');
});

test('library explains research and demo dialog supports keyboard dismissal', async ({ page }) => {
  await page.addInitScript(data => localStorage.setItem('neuroLift_workspace_guest', JSON.stringify({ version: 0, dirty: false, data })), base);
  await page.goto('/#planner');
  await expect(page.getByText('Images not yet available').first()).toBeVisible();
  await page.getByRole('button', { name: /Incline Dumbbell Press/ }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Tab');
  expect(await page.getByRole('dialog').evaluate(el => el.contains(document.activeElement))).toBe(true);
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.getByRole('button', { name: 'Research-supported', exact: true }).click();
  await page.getByText('How to read the research labels', { exact: true }).click();
  await expect(page.getByText('Research-supported does not mean proven best for everyone.')).toBeVisible();
  await expect(page.getByRole('link', { name: /Low-load bench press/ })).toBeVisible();
});

test('Arabic active session fits with enlarged text and announces offline state', async ({ page, context }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(data => localStorage.setItem('neuroLift_workspace_guest', JSON.stringify({ version: 0, dirty: false, data })), { ...active, language: 'ar', neuroLift_fontSize: 'xlarge' });
  await page.goto('/#tracker');
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
  await expect(page.locator('.web-set-row')).toHaveCount(2);
  await expect.poll(() => page.locator('.web-session').evaluate(el => getComputedStyle(el.parentElement!).opacity)).toBe('1');
  await expect.poll(() => page.locator('.web-surface > div').evaluate(el => getComputedStyle(el).opacity)).toBe('1');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await context.setOffline(true);
  await expect(page.getByText('غير متصل · المزامنة متوقفة')).toBeVisible();
  await page.screenshot({ path: 'test-results/refined-session-ar-large.png', fullPage: true });
});
