import { test, expect } from '@playwright/test';
const base = { neuroLift_hasCompletedOnboarding: 'true', neuroLift_userGoal: 'strength' };
const exercises = [{ name: 'Incline Dumbbell Press', sets: [{ id: 's1', weight: 0, reps: 0, completed: false }, { id: 's2', weight: 0, reps: 0, completed: false }] }];
const active = { ...base, neuroLift_tracker_phase: 'active', neuroLift_tracker_selected_exercises: JSON.stringify(exercises.map(e => e.name)), neuroLift_tracker_muscles: '["Chest"]', neuroLift_tracker_active_exercises: JSON.stringify(exercises) };
test.use({ serviceWorkers: 'block' });
for (const mode of ['web', 'android', 'ios']) {
  test(`${mode}: finish shows exercise volume and compares only previous completed work`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.addInitScript(({ active, mode }) => {
      if (mode === 'android') Object.assign(window, { androidBridge: {} });
      if (mode === 'ios') Object.assign(window, { webkit: { messageHandlers: { bridge: {} } } });
      const sets = Array.from({ length: 3 }, (_, i) => ({ id: String(i), weight: 50, reps: 10, completed: true }));
      const name = 'Incline Dumbbell Press';
      localStorage.setItem('neuroLift_workspace_guest', JSON.stringify({ version: 0, dirty: false, data: {
        ...active,
        neuroLift_tracker_active_exercises: JSON.stringify([{ name, sets: [...sets, { id: 'skip', weight: 100, reps: 10, completed: false }] }, { name: 'Push-ups', sets: [{ id: 'bw', weight: 0, reps: 12, completed: true }] }]),
        neuroLift_history: JSON.stringify([{ id: 'previous', date: '2026-10-01T12:00:00Z', durationSeconds: 600, totalVolume: 1400, exercises: [{ name, sets: [{ id: 'p', weight: 50, reps: 28, completed: true }] }] }]),
      } }));
    }, { active, mode });
    await page.goto('/#tracker');
    await page.getByRole('button', { name: /Finish Workout/ }).click();
    await page.getByRole('button', { name: 'Finish Workout', exact: true }).click();
    const result = page.getByRole('region', { name: 'Exercise breakdown' });
    await expect(result).toContainText('Volume: 1,500 kg');
    await expect(result).toContainText('1,400 kg · +100 kg');
    await expect(result).toContainText('Total: 12 reps');
    await expect(result.locator('article').first().locator('li')).toHaveCount(3);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: testInfo.outputPath('finish-screen.png'), fullPage: true });
  });
}
for (const platform of ['web', 'android', 'ios']) {
  test(`${platform}: repeat routine keeps blank planned sets and offers safe per-set references`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.addInitScript(({ platform, base }) => {
      if (platform === 'android') Object.assign(window, { androidBridge: {} });
      if (platform === 'ios') Object.assign(window, { webkit: { messageHandlers: { bridge: {} } } });
      if (localStorage.getItem('neuroLift_workspace_guest')) return;
      localStorage.setItem('neuroLift_workspace_guest', JSON.stringify({ version: 0, dirty: false, data: {
        ...base, neuroLift_tracker_phase: 'selection', neuroLift_tracker_muscles: '["Chest"]',
        neuroLift_tracker_selected_exercises: '[]',
        neuroLift_templates: JSON.stringify([{ id: 'repeat', name: 'Sunday strength', createdAt: '2026-01-01T00:00:00Z', exercises: [{ name: 'Incline Dumbbell Press', targetSets: 3, targetReps: '8-10' }] }]),
        neuroLift_history: JSON.stringify([{ id: 'last', name: 'Sunday strength', date: '2026-10-01T12:00:00Z', duration: 600, totalVolume: 450, exercises: [{ name: 'Incline Dumbbell Press', sets: [
          { id: 'old1', weight: 25, reps: 10, completed: true },
          { id: 'old2', weight: 25, reps: 8, completed: true },
        ] }] }]),
      } }));
    }, { platform, base });
    await page.goto('/#tracker');
    await page.getByRole('button', { name: 'Load Template', exact: true }).click();
    await page.getByRole('dialog').getByRole('button').filter({ hasText: 'Sunday strength' }).first().click();
    await page.getByRole('button', { name: 'Start Session', exact: true }).click();
    await expect(page.locator('.web-set-row')).toHaveCount(3);
    await expect(page.locator('.web-set-reference').first()).toContainText('25 kg × 10');
    await expect(page.locator('.web-set-reference').nth(1)).toContainText('25 kg × 8');
    await expect(page.locator('.web-set-reference').nth(2)).toContainText('No matching set');
    for (let i = 1; i <= 3; i++) {
      await expect(page.getByLabel(`KG — SET ${i}`, { exact: true })).toHaveValue('');
      await expect(page.getByLabel(`REPS — SET ${i}`, { exact: true })).toHaveValue('');
    }
    await page.getByRole('button', { name: 'Use previous values for set 2', exact: true }).click();
    await expect(page.getByLabel('KG — SET 2', { exact: true })).toHaveValue('25');
    await expect(page.getByLabel('REPS — SET 2', { exact: true })).toHaveValue('8');
    await expect(page.getByRole('button', { name: 'Done — SET 2', exact: true })).toHaveAttribute('aria-pressed', 'false');
    await page.getByLabel('KG — SET 1', { exact: true }).fill('27.5');
    await expect(page.getByRole('button', { name: 'Use previous values for set 1', exact: true })).toHaveCount(0);
    await page.reload();
    await expect(page.getByLabel('KG — SET 1', { exact: true })).toHaveValue('27.5');
    await expect(page.getByLabel('REPS — SET 2', { exact: true })).toHaveValue('8');
    await expect(page.locator('.web-set-row')).toHaveCount(3);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
}
test('Android screen back returns through workout selection without discarding sets', async ({ page }) => {
  await page.addInitScript(data => {
    Object.assign(window, { androidBridge: {} });
    localStorage.setItem('neuroLift_workspace_guest', JSON.stringify({ version: 0, dirty: false, data }));
  }, active);
  await page.goto('/#tracker');
  await expect(page.getByLabel('REPS — SET 1', { exact: true })).toBeVisible();
  await page.getByLabel('REPS — SET 1', { exact: true }).fill('8');
  await page.getByRole('button', { name: 'Done — SET 1', exact: true }).click();
  expect(await page.evaluate(() => window.dispatchEvent(new Event('neurolift-screen-back', { cancelable: true })))).toBe(false);
  await expect(page.locator('.web-workout-picker')).toBeVisible();
  expect(new URL(page.url()).hash).toBe('#tracker');
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('neuroLift_workspace_guest')!).data);
  expect(JSON.parse(saved.neuroLift_tracker_active_exercises)[0].sets[0]).toMatchObject({ reps: 8, completed: true });
  expect(await page.evaluate(() => window.dispatchEvent(new Event('neurolift-screen-back', { cancelable: true })))).toBe(false);
  await expect(page.getByRole('button', { name: /Select Exercises/ })).toBeVisible();
  expect(await page.evaluate(() => window.dispatchEvent(new Event('neurolift-screen-back', { cancelable: true })))).toBe(true);
});
test('old completed-session drafts are discarded on upgrade', async ({ page }) => {
  await page.addInitScript(data => localStorage.setItem('neuroLift_workspace_guest', JSON.stringify({ version: 0, dirty: false, data })), {
    ...active, neuroLift_tracker_phase: 'summary', ui_picker_search: '"Back"', ui_picker_muscle: '"Back"',
  });
  await page.goto('/#tracker');
  await expect(page.getByRole('button', { name: 'Chest', exact: true })).toHaveAttribute('aria-pressed', 'false');
  const data = await page.evaluate(() => JSON.parse(localStorage.getItem('neuroLift_workspace_guest')!).data);
  expect(JSON.parse(data.neuroLift_tracker_active_exercises)).toEqual([]);
  expect(JSON.parse(data.ui_picker_search)).toBe('');
});
test('finish then reopen tomorrow starts a clean muscle selection without losing history', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(data => {
    if (!localStorage.getItem('neuroLift_workspace_guest')) localStorage.setItem('neuroLift_workspace_guest', JSON.stringify({ version: 0, dirty: false, data }));
  }, { ...active, ui_picker_search: '"Pull"', ui_picker_muscle: '"Back"' });
  await page.goto('/#tracker');
  await page.getByLabel('REPS — SET 1', { exact: true }).fill('8');
  await page.getByRole('button', { name: 'Done — SET 1', exact: true }).click();
  await page.getByRole('button', { name: /Finish Workout/ }).click();
  await page.getByRole('button', { name: 'Finish Workout', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Start New Workout', exact: true })).toBeVisible();
  // Do not press Start New Workout: this is the real-world path the weekly test missed.
  await page.reload();
  await page.getByRole('button', { name: 'Chest', exact: true }).click();
  await page.getByRole('button', { name: /Select Exercises/ }).click();
  await expect(page.locator('.web-workout-picker input').first()).toHaveValue('');
  await expect(page.locator('.web-mobile-filters')).toContainText('Chest');
  const data = await page.evaluate(() => JSON.parse(localStorage.getItem('neuroLift_workspace_guest')!).data);
  expect(JSON.parse(data.neuroLift_tracker_selected_exercises)).toEqual([]);
  expect(JSON.parse(data.neuroLift_history)).toHaveLength(1);
});

test('exercise card buttons and swipes preserve sets and dismiss menus', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(data => localStorage.setItem('neuroLift_workspace_guest', JSON.stringify({ version: 0, dirty: false, data })), {
    ...active, neuroLift_tracker_active_exercises: JSON.stringify([...exercises, { name: 'Pull-ups', sets: [{ id: 'pull', weight: 0, reps: 0, completed: false }] }]),
  });
  await page.goto('/#tracker');
  await page.getByLabel('KG — SET 1', { exact: true }).fill('25');
  await page.getByLabel('REPS — SET 1', { exact: true }).fill('10');
  await page.getByRole('button', { name: 'Done — SET 1', exact: true }).click();
  const firstMenu = page.locator('.web-set-menu').first();
  await firstMenu.locator('summary').click();
  await expect(firstMenu).toHaveAttribute('open', '');
  await page.locator('.web-set-editor h2').click();
  await expect(firstMenu).not.toHaveAttribute('open', '');
  await page.locator('.web-set-menu').nth(1).locator('summary').click();
  await firstMenu.locator('summary').click();
  await expect(page.locator('.web-set-menu').nth(1)).not.toHaveAttribute('open', '');
  await page.keyboard.press('Escape');
  await expect(page.locator('.web-set-menu[open]')).toHaveCount(0);
  await page.getByRole('button', { name: 'Next', exact: true }).last().click();
  await expect(page.locator('.web-set-editor h2')).toHaveText('Pull-ups');
  const card = page.locator('.web-set-editor');
  await card.dispatchEvent('touchstart', { touches: [{ identifier: 0, clientX: 100, clientY: 200 }] });
  await card.dispatchEvent('touchend', { changedTouches: [{ identifier: 0, clientX: 260, clientY: 205 }] });
  await expect(card.locator('h2')).toHaveText('Incline Dumbbell Press');
  await expect(page.getByLabel('KG — SET 1', { exact: true })).toHaveValue('25');
  await expect(page.getByRole('button', { name: 'Done — SET 1', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await card.dispatchEvent('touchstart', { touches: [{ identifier: 0, clientX: 200, clientY: 300 }] });
  await card.dispatchEvent('touchend', { changedTouches: [{ identifier: 0, clientX: 180, clientY: 100 }] });
  await expect(card.locator('h2')).toHaveText('Incline Dumbbell Press');
  await firstMenu.locator('summary').click();
  await firstMenu.getByRole('button', { name: 'Remove set', exact: true }).click();
  await expect(page.locator('.web-set-menu[open]')).toHaveCount(0);
});
test('untouched sets are blocked and clearing reps invalidates completion', async ({ page }) => {
  await page.addInitScript(data => localStorage.setItem('neuroLift_workspace_guest', JSON.stringify({ version: 0, dirty: false, data })), active);
  await page.goto('/#tracker');
  const done = page.getByRole('button', { name: 'Done — SET 1', exact: true });
  await expect(done).toBeDisabled();
  await page.getByLabel('REPS — SET 1', { exact: true }).fill('8');
  await done.click();
  await expect(done).toHaveAttribute('aria-pressed', 'true');
  await page.getByLabel('REPS — SET 1', { exact: true }).fill('');
  await expect(done).toHaveAttribute('aria-pressed', 'false');
  await expect(page.getByRole('button', { name: /Finish Workout/ })).toBeDisabled();
  await page.getByRole('button', { name: 'Reset session', exact: true }).click();
  await expect(page.getByRole('dialog')).toContainText('Reset Session');
});
test('iOS-mode workout completes offline and survives the next load', async ({ page, context }) => {
  await page.addInitScript(data => {
    Object.assign(window, { webkit: { messageHandlers: { bridge: {} } } });
    if (!localStorage.getItem('neuroLift_workspace_guest')) localStorage.setItem('neuroLift_workspace_guest', JSON.stringify({ version: 0, dirty: false, data }));
  }, { ...active, neuroLift_tracker_active_template: 'upper-a', neuroLift_tracker_active_template_name: 'Upper A' });
  await page.goto('/#tracker');
  await context.setOffline(true);
  await page.getByLabel('KG — SET 1', { exact: true }).fill('15');
  await page.getByLabel('REPS — SET 1', { exact: true }).fill('8');
  await page.getByRole('button', { name: 'Done — SET 1', exact: true }).click();
  await page.getByRole('button', { name: /Finish Workout/ }).click();
  await page.getByRole('button', { name: 'Finish Workout', exact: true }).click();
  await expect.poll(() => page.evaluate(() => JSON.parse(JSON.parse(localStorage.getItem('neuroLift_workspace_guest')!).data.neuroLift_history)[0].totalVolume)).toBe(120);
  await expect.poll(() => page.evaluate(() => JSON.parse(JSON.parse(localStorage.getItem('neuroLift_workspace_guest')!).data.neuroLift_history)[0].name)).toBe('Upper A');
  await context.setOffline(false);
  await page.reload();
  await page.locator('.web-navigation').getByRole('button', { name: 'Progress', exact: true }).click();
  await expect(page.getByText('Incline Dumbbell Press', { exact: true }).last()).toBeVisible();
});

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
  await page.locator('.web-navigation').getByRole('button', { name: 'Progress', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Training journal' })).toBeVisible();
  await expect(page.getByText('Incline Dumbbell Press', { exact: true }).last()).toBeVisible();
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
  await page.getByRole('dialog', { name: 'More', exact: true }).getByRole('button', { name: 'Account', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Account & sync' })).toBeVisible();
  await expect(nav.getByRole('button', { name: 'More', exact: true })).toHaveAttribute('aria-expanded', 'false');
});

test('journal chart can track an exercise top-set load over time', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const workout = (id: string, date: string, weight: number) => ({
    id, date, durationSeconds: 1800, name: 'Chest', totalVolume: weight * 8,
    exercises: [{ name: 'Incline Dumbbell Press', sets: [{ id: `${id}-set`, weight, reps: 8, completed: true }] }],
  });
  await page.addInitScript(data => localStorage.setItem('neuroLift_workspace_guest', JSON.stringify({ version: 0, dirty: false, data })), {
    ...base,
    neuroLift_history: JSON.stringify([
      workout('older', '2026-10-01T12:00:00.000Z', 30),
      workout('newer', '2026-10-08T12:00:00.000Z', 35),
      { ...workout('unrelated', '2026-10-09T12:00:00.000Z', 50), exercises: [{ name: 'Barbell Squat', sets: [{ id: 'squat', weight: 50, reps: 8, completed: true }] }] },
    ]),
  });
  await page.goto('/#journal');
  await page.getByLabel('Volume Progression').selectOption('exercise:Incline Dumbbell Press');
  await expect(page.getByRole('heading', { name: 'Heaviest set · load' })).toBeVisible();
  await expect(page.locator('svg circle')).toHaveCount(2);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await expect(page.locator('svg path').first()).toBeVisible();
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
  await expect(page.getByText('غير متصل · البيانات على هذا الجهاز')).toBeVisible();
  await page.screenshot({ path: 'test-results/refined-session-ar-large.png', fullPage: true });
});
