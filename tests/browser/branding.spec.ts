import { test, expect } from '@playwright/test';
test('website uses the Android training artwork for branding and install icons', async ({ page, request }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.addInitScript(() => localStorage.setItem('neuroLift_workspace_guest', JSON.stringify({ version: 0, dirty: false, data: { neuroLift_hasCompletedOnboarding: 'true', neuroLift_userGoal: 'strength' } })));
  await page.goto('/#home');
  await expect(page.locator('.web-brand-icon')).toBeVisible();
  await expect(page.locator('.web-brand-icon')).toHaveAttribute('src', '/brand/training-icon-192.png');
  await expect(page.locator('link[rel="icon"]')).toHaveAttribute('href', '/brand/training-icon-32.png');
  const manifest = await (await request.get('/manifest.webmanifest')).json();
  expect(manifest.icons.map((icon: { sizes: string }) => icon.sizes)).toEqual(['192x192', '512x512']);
  for (const size of [32, 180, 192, 512]) {
    const dimensions = await page.evaluate(async size => {
      const image = new Image(); image.src = `/brand/training-icon-${size}.png`; await image.decode();
      return [image.naturalWidth, image.naturalHeight];
    }, size);
    expect(dimensions).toEqual([size, size]);
  }
});
