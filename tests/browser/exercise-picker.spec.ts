import { test, expect } from '@playwright/test';

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
  const groups = page.getByRole('group', { name: 'Muscle group' });
  const areas = page.getByRole('group', { name: 'Muscle area' });
  await expect(groups.getByRole('button', { name: 'Back' })).toHaveAttribute('aria-pressed', 'true');
  await page.getByText('Pull-ups', { exact: true }).click();
  await areas.getByRole('button', { name: 'Mid Back (Thickness)' }).click();
  await page.getByText('Inverted Rows', { exact: true }).click();
  await expect(page.getByText('Selected exercises: 2')).toBeVisible();
  await areas.getByRole('button', { name: 'Lats (Width)' }).click();
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

test('library opens a browsable research view with linked studies', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('neuroLift_workspace_guest', JSON.stringify({
    version: 0, dirty: false, data: {
      neuroLift_hasCompletedOnboarding: 'true', neuroLift_userGoal: 'strength',
    },
  })));
  await page.goto('/#planner');
  await page.getByRole('button', { name: 'Evidence-backed only' }).click();
  await expect(page.getByRole('heading', { name: 'Research-backed options with demonstrations' }).first()).toBeVisible();
  await expect(page.getByRole('link', { name: /Low-load bench press and push-up/ })).toBeVisible();
  await page.getByRole('button', { name: 'All exercises' }).click();
  await expect(page.getByText('Incline Dumbbell Press', { exact: true })).toBeVisible();
});
