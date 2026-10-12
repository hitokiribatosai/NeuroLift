// Unlike context.setOffline(), disconnect the origin without disabling WebKit's
// service-worker interception. Run after npm run build.
import { webkit, chromium, devices, expect } from '@playwright/test';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, resolve } from 'node:path';

for (const [name, engine] of Object.entries({ webkit, chromium })) {
  let online = true;
  const server = createServer(async (req, res) => {
    if (!online) { req.socket.destroy(); return; }
    const pathname = new URL(req.url, 'http://localhost').pathname;
    try {
      const path = resolve('dist', pathname === '/' ? 'index.html' : pathname.slice(1));
      const body = await readFile(path);
      const mime = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css', '.json': 'application/json', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml' };
      res.writeHead(200, { 'Content-Type': mime[extname(path)] || 'application/octet-stream' });
      res.end(body);
    } catch { res.writeHead(404); res.end(); }
  });
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  const url = `http://127.0.0.1:${server.address().port}/#account`;
  const browser = await engine.launch();
  try {
    const context = await browser.newContext(name === 'webkit' ? devices['iPhone 13'] : {});
    const page = await context.newPage();
    await page.goto(url);
    await page.evaluate(async () => { await navigator.serviceWorker.ready; });
    await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);
    online = false;
    await page.reload();
    await expect(page.getByRole('heading', { name: 'Account & sync' })).toBeVisible();
    const reopened = await context.newPage();
    await page.close();
    await reopened.goto(url);
    await expect(reopened.getByRole('heading', { name: 'Account & sync' })).toBeVisible();
    console.log(`${name}: offline reload and closed-tab reopening passed with server unavailable`);
  } finally { await browser.close(); await new Promise(r => server.close(r)); }
}
