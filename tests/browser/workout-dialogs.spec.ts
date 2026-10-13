import { test, expect } from '@playwright/test';
for (const platform of ['web', 'android', 'ios']) {
  for (const phase of ['active', 'selection']) test(`${platform}: ${phase} dialogs remain usable`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.addInitScript(({ platform, phase }) => {
      if (platform === 'android') Object.assign(window, { androidBridge: {} });
      if (platform === 'ios') Object.assign(window, { webkit: { messageHandlers: { bridge: {} } } });
      const vv = new EventTarget();
      Object.assign(vv, { height: 844, width: 390, offsetTop: 0 });
      Object.defineProperty(window, 'visualViewport', { value: vv });
      const exercise = { name: 'Incline Dumbbell Press', sets: [{ id: 'first', weight: 20, reps: 8, completed: false }] };
      localStorage.setItem('neurolift.device-tour.v1', JSON.stringify({ mode: 'done' }));
      localStorage.setItem('neuroLift_workspace_guest', JSON.stringify({ version: 0, dirty: false, data: {
        neuroLift_hasCompletedOnboarding: 'true', neuroLift_userGoal: 'strength',
        neuroLift_tracker_phase: phase, neuroLift_tracker_muscles: '["Chest"]',
        neuroLift_tracker_selected_exercises: JSON.stringify([exercise.name]),
        neuroLift_tracker_active_exercises: JSON.stringify(phase === 'active' ? [exercise] : []),
      } }));
    }, { platform, phase });
    await page.goto('/#tracker');
    if (phase === 'active') {
      await expect(page.locator('section [aria-label="Workout notification"], section [aria-label="Rest alerts"]')).toHaveCount(0);
      await page.getByRole('button', { name: 'View details', exact: true }).click();
      const dialog = page.getByRole('dialog');
      await expect(dialog).toBeVisible();
      await expect(dialog.getByRole('heading', { name: 'Incline Dumbbell Press' })).toBeVisible();
      await dialog.getByRole('button', { name: 'Close', exact: true }).last().click();
      await expect(dialog).toHaveCount(0);
      await expect(page.getByRole('button', { name: 'Done — SET 1', exact: true })).toBeVisible();
    } else {
      await page.getByRole('button', { name: 'Save as Template', exact: true }).click();
      const dialog = page.getByRole('dialog');
      await dialog.locator('input').fill('Sunday chest');
      await page.evaluate(() => {
        Object.assign(window.visualViewport!, { height: 500, offsetTop: 20 });
        window.visualViewport!.dispatchEvent(new Event('resize'));
      });
      await expect.poll(async () => {
        const box = await dialog.getByRole('button', { name: 'Cancel', exact: true }).boundingBox();
        return box!.y + box!.height;
      }).toBeLessThanOrEqual(520);
      await dialog.getByRole('button', { name: 'Cancel', exact: true }).click();
      await expect(dialog).toHaveCount(0);
    }
  });
}
