// Package the existing Android artwork for web use; no new artwork is generated.
import { chromium } from '@playwright/test';
import { readFile, mkdir } from 'node:fs/promises';
const source = await readFile('android/app/src/main/res/drawable-nodpi/training_mark.png');
await mkdir('public/brand', { recursive: true });
const browser = await chromium.launch();
try {
  for (const size of [32, 180, 192, 512]) {
    const page = await browser.newPage({ viewport: { width: size, height: size }, deviceScaleFactor: 1 });
    await page.setContent(`<style>html,body{margin:0;background:#17242a;width:100%;height:100%}img{display:block;width:100%;height:100%}</style><img alt="" src="data:image/png;base64,${source.toString('base64')}">`);
    await page.locator('img').evaluate(image => image.decode());
    await page.screenshot({ path: `public/brand/training-icon-${size}.png` });
    await page.close();
  }
} finally { await browser.close(); }
