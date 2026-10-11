import { test, expect } from '@playwright/test';

test('home introduces the app in English and opens the exercise library', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(() => localStorage.setItem('neuroLift_workspace_guest', JSON.stringify({
    version: 0, dirty: false, data: { neuroLift_hasCompletedOnboarding: 'true', neuroLift_userGoal: 'strength' },
  })));
  await page.goto('/#home');
  await expect(page.getByText('Build a session, log every set, and see your progress in one place.')).toBeVisible();
  await page.getByRole('button', { name: 'Browse exercises' }).click();
  await expect(page.getByRole('heading', { name: 'Exercise Library' })).toBeVisible();
  await expect(page.getByText('Incline Dumbbell Press', { exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('library opens on exercises and previews a bundled demonstration', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('neuroLift_workspace_guest', JSON.stringify({
    version: 0, dirty: false, data: { neuroLift_hasCompletedOnboarding: 'true', neuroLift_userGoal: 'strength' },
  })));
  await page.goto('/#planner');
  const card = page.getByRole('button').filter({ hasText: 'Incline Dumbbell Press' }).first();
  await expect(card).toBeVisible();
  await expect(card.locator('img')).toHaveAttribute('src', /Incline_Dumbbell_Press-0\.jpg$/);
});

test('library equipment filter narrows exercise results', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('neuroLift_workspace_guest', JSON.stringify({
    version: 0, dirty: false, data: { neuroLift_hasCompletedOnboarding: 'true', neuroLift_userGoal: 'strength' },
  })));
  await page.goto('/#planner');
  const equipment = page.getByRole('group', { name: 'Filter exercises by equipment' });
  await equipment.getByRole('button', { name: 'Dumbbells', exact: true }).click();
  await expect(page.getByText('Incline Dumbbell Press', { exact: true })).toBeVisible();
  await expect(page.getByText('Decline Pushups', { exact: true })).toHaveCount(0);
});

test('workout exercise choices persist while switching muscle areas', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(() => localStorage.setItem('neuroLift_workspace_guest', JSON.stringify({
    version: 0, dirty: false, data: {
      neuroLift_hasCompletedOnboarding: 'true',
      neuroLift_userGoal: 'strength',
      neuroLift_tracker_phase: 'selection',
      neuroLift_tracker_muscles: JSON.stringify(['Back']),
      neuroLift_tracker_selected_exercises: '[]',
    },
  })));
  await page.goto('/#tracker');
  await page.locator('.web-workout-picker > .web-mobile-filters').click();
  const groups = page.getByRole('group', { name: 'Muscle group' });
  const areas = page.getByRole('group', { name: 'Muscle area' });
  await expect(groups.getByRole('button', { name: 'Back' })).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('dialog').getByRole('button', { name: 'Close', exact: true }).click();
  await page.getByText('Pull-ups', { exact: true }).click();
  await page.locator('.web-workout-picker > .web-mobile-filters').click();
  await areas.getByRole('button', { name: 'Mid Back (Thickness)' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Close', exact: true }).click();
  await page.getByText('Inverted Rows', { exact: true }).click();
  await expect(page.locator('.web-selection-actions').getByText('Selected exercises: 2')).toBeVisible();
  await page.locator('.web-workout-picker > .web-mobile-filters').click();
  await areas.getByRole('button', { name: 'Lats (Width)' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Close', exact: true }).click();
  await expect(page.getByLabel('Pull-ups', { exact: true })).toBeChecked();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('template editor adds exercises from separate muscle groups', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('neuroLift_workspace_guest', JSON.stringify({
    version: 0, dirty: false, data: {
      neuroLift_hasCompletedOnboarding: 'true',
      neuroLift_userGoal: 'strength',
      neuroLift_tracker_phase: 'selection',
      neuroLift_tracker_muscles: JSON.stringify(['Back']),
      neuroLift_templates: JSON.stringify([{
        id: 'example', name: 'Pull day', createdAt: '2026-01-01T00:00:00Z',
        exercises: [{ name: 'Pull-ups', targetSets: 3, targetReps: '8', notes: '' }],
      }]),
    },
  })));
  await page.goto('/#tracker');
  await page.getByRole('button', { name: 'Load Template' }).click();
  await page.getByTitle('Edit template').click();
  const areas = page.getByRole('group', { name: 'Muscle area' }).last();
  await areas.getByRole('button', { name: 'Mid Back (Thickness)' }).click();
  await page.getByRole('button', { name: 'Inverted Rows', exact: true }).click();
  const groups = page.getByRole('group', { name: 'Muscle group' }).last();
  await groups.getByRole('button', { name: 'Legs' }).click();
  await page.getByRole('group', { name: 'Muscle area' }).last().getByRole('button', { name: 'Quads' }).click();
  await page.getByRole('button', { name: 'Pistol Squats', exact: true }).click();
  await expect(page.getByText('Selected exercises: 3')).toBeVisible();
});

test('weekly template assignment is visible and launches a fresh planned session', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('neuroLift_workspace_guest', JSON.stringify({
    version: 0, dirty: false, data: {
      neuroLift_hasCompletedOnboarding: 'true',
      neuroLift_userGoal: 'strength',
      neuroLift_tracker_phase: 'selection',
      neuroLift_tracker_muscles: '["Chest"]',
      neuroLift_tracker_selected_exercises: '[]',
      neuroLift_templates: JSON.stringify([{
        id: 'sunday', name: 'Sunday plan', createdAt: '2026-01-01T00:00:00Z',
        exercises: [{ name: 'Incline Dumbbell Press', targetSets: 3, targetReps: '8-10' }],
      }]),
    },
  })));
  await page.goto('/#tracker');
  await page.getByRole('button', { name: 'Load Template' }).click();
  const dialog = page.getByRole('dialog');
  const monday = dialog.getByRole('button', { name: 'Mon · Sunday plan', exact: true });
  await monday.click();
  await expect(monday).toHaveAttribute('aria-pressed', 'true');
  await dialog.getByRole('button').filter({ hasText: 'Sunday plan' }).first().click();
  await page.getByRole('button', { name: 'Start Session', exact: true }).click();
  await expect(page.getByLabel('KG — SET 1', { exact: true })).toHaveValue('');
  await expect(page.getByLabel('REPS — SET 1', { exact: true })).toHaveValue('');
  await expect(page.locator('.web-set-row')).toHaveCount(3);
  await expect(page.getByText('Target reps: 8-10')).toBeVisible();
  const stored = await page.evaluate(() => JSON.parse(JSON.parse(localStorage.getItem('neuroLift_workspace_guest')!).data.neuroLift_tracker_active_exercises));
  expect(stored[0].sets).toHaveLength(3);
  expect(stored[0].sets.every((set: { weight: number; reps: number; completed: boolean }) => set.weight === 0 && set.reps === 0 && !set.completed)).toBe(true);
});

test('library opens a browsable research view with linked studies', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('neuroLift_workspace_guest', JSON.stringify({
    version: 0, dirty: false, data: {
      neuroLift_hasCompletedOnboarding: 'true', neuroLift_userGoal: 'strength',
    },
  })));
  await page.goto('/#planner');
  await page.getByRole('button', { name: 'Research-supported', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Research-backed options with demonstrations' }).first()).toBeVisible();
  await expect(page.getByRole('link', { name: /Low-load bench press and push-up/ })).toBeVisible();
  await page.getByRole('button', { name: 'All exercises' }).click();
  await expect(page.getByText('Incline Dumbbell Press', { exact: true })).toBeVisible();
});
