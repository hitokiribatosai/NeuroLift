import { expect, test } from '@playwright/test';

test.use({ serviceWorkers: 'block' });
for (const platform of ['web', 'android', 'ios']) {
  test(`${platform}: failed finish preserves session; retry saves once and reload starts clean`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.addInitScript(platform => {
      if (platform === 'android') Object.assign(window, { androidBridge: {} });
      if (platform === 'ios') Object.assign(window, { webkit: { messageHandlers: { bridge: {} } } });
      if (localStorage.getItem('neuroLift_workspace_guest')) return;
      const exercises = [{ name: 'Incline Dumbbell Press', sets: [{ id: 'set-1', weight: 50, reps: 10, completed: true }] }];
      localStorage.setItem('neuroLift_workspace_guest', JSON.stringify({ version: 0, dirty: false, data: {
        neuroLift_hasCompletedOnboarding: 'true', neuroLift_userGoal: 'strength',
        neuroLift_tracker_phase: 'active', neuroLift_tracker_muscles: '["Chest"]',
        neuroLift_tracker_selected_exercises: '["Incline Dumbbell Press"]',
        neuroLift_tracker_active_exercises: JSON.stringify(exercises),
        neuroLift_workout_active: 'true', neuroLift_workout_start_time: String(Date.now() - 60000),
      } }));
    }, platform);
    page.on('dialog', dialog => dialog.dismiss());
    await page.goto('/#tracker');
    await expect(page.getByLabel('KG — SET 1', { exact: true })).toHaveValue('50');
    const sessionId = await page.evaluate(() => JSON.parse(localStorage.getItem('neuroLift_workspace_guest')!).data.neuroLift_tracker_session_id);
    expect(sessionId).toBeTruthy();
    // Fail only the atomic completion write, not unrelated preference/timer writes.
    await page.evaluate(() => {
      const original = Storage.prototype.setItem;
      Storage.prototype.setItem = function (key, value) {
        if (key === 'neuroLift_workspace_guest') {
          const data = JSON.parse(value).data;
          if (data.neuroLift_history && !data.neuroLift_tracker_session_id) {
            Storage.prototype.setItem = original;
            throw new DOMException('Simulated storage full', 'QuotaExceededError');
          }
        }
        return original.call(this, key, value);
      };
    });
    const finish = async () => {
      await page.getByRole('button', { name: /Finish Workout/ }).click();
      await page.getByRole('button', { name: 'Finish Workout', exact: true }).click();
    };
    await finish();
    await expect(page.getByRole('alert')).toContainText('Workout could not be saved');
    const failed = await page.evaluate(() => JSON.parse(localStorage.getItem('neuroLift_workspace_guest')!).data);
    expect(failed.neuroLift_tracker_session_id).toBe(sessionId);
    expect(failed.neuroLift_workout_active).toBe('true');
    expect(failed.neuroLift_history).toBeUndefined();
    await page.reload();
    await expect(page.getByLabel('KG — SET 1', { exact: true })).toHaveValue('50');
    await finish();
    await expect(page.getByRole('region', { name: 'Exercise breakdown' })).toContainText('500 kg');
    await page.reload();
    await expect(page.getByRole('button', { name: /Select Exercises/ })).toBeVisible();
    const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('neuroLift_workspace_guest')!).data);
    const history = JSON.parse(saved.neuroLift_history);
    expect(history).toHaveLength(1);
    expect(history[0].id).toBe(sessionId);
    expect(saved.neuroLift_workout_active).toBe('false');
    expect(saved.neuroLift_tracker_session_id).toBeUndefined();
  });
}
