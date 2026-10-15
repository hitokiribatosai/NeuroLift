import { test, expect, Page } from '@playwright/test';
const names = ['Incline Dumbbell Press', 'Dumbbell Incline Fly', 'Incline Hammer Strength Press'];
async function seed(page: Page, platform: string, phase = 'active') {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(({ platform, phase, names }) => {
    if (platform === 'android') Object.assign(window, { androidBridge: {} });
    if (platform === 'ios') Object.assign(window, { webkit: { messageHandlers: { bridge: {} } } });
    localStorage.setItem('neurolift.device-tour.v1', JSON.stringify({ mode: 'done' }));
    if (localStorage.getItem('neuroLift_workspace_guest')) return;
    localStorage.setItem('neuroLift_workspace_guest', JSON.stringify({ version: 0, dirty: false, data: {
      neuroLift_hasCompletedOnboarding: 'true', neuroLift_userGoal: 'strength', neuroLift_tracker_phase: phase,
      neuroLift_web_theme: platform === 'android' ? 'dark' : 'light', neuroLift_theme: platform === 'android' ? 'dark' : 'light', neuroLift_android_theme: platform === 'android' ? 'dark' : 'light',
      neuroLift_tracker_muscles: '["Chest"]', ui_picker_muscle: '"Chest"',
      neuroLift_tracker_selected_exercises: JSON.stringify(names),
      neuroLift_templates: JSON.stringify([{ id: 'test-template', name: 'Sunday chest', createdAt: '2026-10-01T12:00:00Z', exercises: [{ name: names[0], targetSets: 3, targetReps: '8-10' }] }]),
      neuroLift_tracker_active_exercises: JSON.stringify(names.map((name, j) => ({ name, sets: Array.from({ length: j ? 1 : 6 }, (_, i) => ({ id: `${j}-${i}`, weight: i ? 0 : 20, reps: i ? 0 : 8, completed: i === 0 })) }))),
    } }));
  }, { platform, phase, names });
  await page.goto('/#tracker');
}
test.use({ serviceWorkers: 'block' });
for (const platform of ['web', 'android', 'ios']) {
  test(`${platform}: rest picker uses styled choices and persists selection`, async ({ page }, info) => {
    await page.emulateMedia({ colorScheme: platform === 'android' ? 'dark' : 'light' });
    await seed(page, platform, 'setup');
    await expect(page.locator('html')).toHaveClass(new RegExp(platform === 'android' ? 'dark' : 'light'));
    const trigger = page.locator('.web-rest-picker-trigger');
    await trigger.click();
    const dialog = page.getByRole('dialog');
    await expect(dialog.locator('.web-rest-options > button')).toHaveCount(5);
    await expect(dialog.getByRole('button', { name: /2:00/ })).toHaveAttribute('aria-pressed', 'true');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: info.outputPath('rest-picker.png'), animations: 'disabled' });
    await dialog.getByRole('button', { name: /1:30/ }).click();
    await expect(dialog).toHaveCount(0);
    await expect(trigger).toContainText('1:30');
    await trigger.click();
    await expect(dialog.getByRole('button', { name: /1:30/ })).toHaveAttribute('aria-pressed', 'true');
    await dialog.getByRole('button', { name: 'Close', exact: true }).click();
    await page.reload();
    await expect(trigger).toContainText('1:30');
  });
  test(`${platform}: swipes start on middle-card fields and buttons without activating them`, async ({ page }) => {
    await seed(page, platform);
    const card = page.locator('.web-set-editor');
    const field = page.getByLabel('KG — SET 1', { exact: true });
    const settled = () => expect.poll(() => card.evaluate(el => el.getAnimations().filter(a => a.playState === 'running').length)).toBe(0);
    await field.dispatchEvent('touchstart', { touches: [{ identifier: 0, clientX: 260, clientY: 400 }] });
    await field.dispatchEvent('touchmove', { touches: [{ identifier: 0, clientX: 140, clientY: 403 }] });
    expect(await card.evaluate(el => new DOMMatrixReadOnly(getComputedStyle(el).transform).m41)).toBe(-120);
    await field.dispatchEvent('touchend', { changedTouches: [{ identifier: 0, clientX: 140, clientY: 403 }] });
    await expect(card.locator('h2')).toHaveText(names[1]);
    await settled();
    const done = page.getByLabel('Done — SET 1', { exact: true });
    await done.dispatchEvent('touchstart', { touches: [{ identifier: 0, clientX: 100, clientY: 400 }] });
    await done.dispatchEvent('touchmove', { touches: [{ identifier: 0, clientX: 220, clientY: 403 }] });
    await done.dispatchEvent('touchend', { changedTouches: [{ identifier: 0, clientX: 220, clientY: 403 }] });
    await done.dispatchEvent('click', { bubbles: true, cancelable: true, detail: 1 });
    await expect(card.locator('h2')).toHaveText(names[0]);
    await settled();
    await expect(done).toHaveAttribute('aria-pressed', 'true');
    await expect(field).toHaveValue('20');
    // A subsequent deliberate tap must still focus/edit the field and activate a button.
    await field.dispatchEvent('touchstart', { touches: [{ identifier: 0, clientX: 160, clientY: 400 }] });
    await field.dispatchEvent('touchend', { changedTouches: [{ identifier: 0, clientX: 160, clientY: 400 }] });
    await field.fill('25');
    await expect(field).toHaveValue('25');
    await done.click();
    await expect(done).toHaveAttribute('aria-pressed', 'false');
  });
  test(`${platform}: only the exercise card follows the finger and cancelled swipes spring back`, async ({ page }) => {
    await seed(page, platform);
    const card = page.locator('.web-set-editor');
    await expect(card).toBeVisible();
    const header = await page.locator('.web-session-header').boundingBox();
    const offset = () => card.evaluate(el => new DOMMatrixReadOnly(getComputedStyle(el).transform).m41);
    const settled = () => expect.poll(() => card.evaluate(el => el.getAnimations().filter(a => a.playState === 'running').length)).toBe(0);
    await card.dispatchEvent('touchstart', { touches: [{ identifier: 0, clientX: 280, clientY: 300 }] });
    await card.dispatchEvent('touchmove', { touches: [{ identifier: 0, clientX: 160, clientY: 304 }] });
    expect(await offset()).toBe(-120);
    expect(await page.locator('.web-session-header').boundingBox()).toEqual(header);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await card.dispatchEvent('touchcancel');
    await settled();
    expect(await offset()).toBe(0);
    await expect(card.locator('h2')).toHaveText(names[0]);
    await card.dispatchEvent('touchstart', { touches: [{ identifier: 0, clientX: 280, clientY: 300 }] });
    await card.dispatchEvent('touchmove', { touches: [{ identifier: 0, clientX: 160, clientY: 304 }] });
    await card.dispatchEvent('touchend', { changedTouches: [{ identifier: 0, clientX: 100, clientY: 304 }] });
    await expect(card.locator('h2')).toHaveText(names[1]);
    await settled();
    expect(await offset()).toBe(0);
    await expect(page.getByLabel('KG — SET 1', { exact: true })).toHaveValue('20');
  });
  test(`${platform}: workout search stays in Chest`, async ({ page }) => {
    await seed(page, platform, 'selection');
    const search = page.getByPlaceholder(/search/i).first();
    await search.fill('curl');
    await expect(page.getByText('No exercises found', { exact: true })).toBeVisible();
    await search.fill('press');
    await expect(page.getByText('Incline Dumbbell Press', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('Dumbbell Shoulder Press', { exact: true })).toHaveCount(0);
  });
  test(`${platform}: swipe keeps scroll and completed sets`, async ({ page }) => {
    await seed(page, platform);
    const card = page.locator('.web-set-editor');
    await expect(card).toBeVisible();
    await page.evaluate(() => window.scrollTo(0, 500));
    const before = await page.evaluate(() => scrollY);
    expect(before).toBeGreaterThan(100);
    await card.dispatchEvent('touchstart', { touches: [{ identifier: 0, clientX: 280, clientY: 300 }] });
    await card.dispatchEvent('touchend', { changedTouches: [{ identifier: 0, clientX: 80, clientY: 305 }] });
    await expect(card.locator('h2')).toHaveText(names[1]);
    await expect.poll(() => card.evaluate(el => el.getAnimations().filter(a => a.playState === 'running').length)).toBe(0);
    expect(Math.abs((await page.evaluate(() => scrollY)) - before)).toBeLessThan(3);
    await card.dispatchEvent('touchstart', { touches: [{ identifier: 0, clientX: 80, clientY: 300 }] });
    await card.dispatchEvent('touchend', { changedTouches: [{ identifier: 0, clientX: 280, clientY: 305 }] });
    await expect(card.locator('h2')).toHaveText(names[0]);
    await expect(page.getByLabel('KG — SET 1', { exact: true })).toHaveValue('20');
    await expect(page.getByLabel('Done — SET 1', { exact: true })).toHaveAttribute('aria-pressed', 'true');
  });
  test(`${platform}: reorder highlights, drags and applies without losing sets`, async ({ page }) => {
    await seed(page, platform);
    await page.getByRole('button', { name: /reorder/i }).click();
    const items = page.locator('[data-reorder-list] > li');
    await page.getByLabel(`Move down: ${names[0]}`, { exact: true }).click();
    await expect(items.nth(1)).toHaveAttribute('data-exercise', names[0]);
    await expect(items.nth(1)).toHaveAttribute('data-moved', 'true');
    expect(await items.nth(1).evaluate(el => getComputedStyle(el).backgroundColor)).not.toEqual(await items.first().evaluate(el => getComputedStyle(el).backgroundColor));
    const handle = page.getByLabel(`Drag: ${names[0]}`, { exact: true });
    await handle.click({ trial: true });
    const from = (await handle.boundingBox())!;
    const to = (await items.first().boundingBox())!;
    await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2);
    await page.mouse.down();
    await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2 - 8, { steps: 2 });
    await expect(items.nth(1)).toHaveAttribute('data-dragging', 'true');
    await page.mouse.move(from.x + from.width / 2, to.y + 5, { steps: 15 });
    await page.mouse.up();
    await expect(items.first()).toHaveAttribute('data-exercise', names[0]);
    await page.getByRole('button', { name: /apply/i }).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(page.getByLabel('KG — SET 1', { exact: true })).toHaveValue('20');
  });
  test(`${platform}: template dialog has no decorative heading bars`, async ({ page }, info) => {
    await seed(page, platform, 'selection');
    await page.getByRole('button', { name: 'Save as Template', exact: true }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog.locator('h3 > span')).toHaveCount(0);
    await expect(dialog.locator('input')).toBeVisible();
    expect(await dialog.evaluate(el => getComputedStyle(el, '::before').content)).toMatch(/none|normal/);
    await page.screenshot({ path: info.outputPath('template.png'), animations: 'disabled' });
    await dialog.getByRole('button', { name: 'Cancel', exact: true }).click();
    await page.getByRole('button', { name: 'Load Template', exact: true }).click();
    await page.getByTitle('Delete template', { exact: true }).click();
    const confirmation = page.getByRole('dialog').last();
    await expect(confirmation).toContainText('Sunday chest');
    await expect(confirmation.locator('h3 > span, .absolute')).toHaveCount(0);
    expect(await confirmation.evaluate(el => getComputedStyle(el, '::before').content)).toMatch(/none|normal/);
    await page.screenshot({ path: info.outputPath('delete-template.png'), animations: 'disabled' });
    await confirmation.getByRole('button', { name: 'Cancel', exact: true }).click();
    await expect(page.getByRole('dialog').getByText('Sunday chest', { exact: true })).toBeVisible();
  });
}
