import { defineConfig, devices } from '@playwright/test';

// Real browser IndexedDB transactions, independent of production UI activation.
export default defineConfig({
  testDir: './tests/persistence',
  timeout: 30000,
  use: { baseURL: 'http://127.0.0.1:4181', headless: true, serviceWorkers: 'block' },
  projects: [
    { name: 'chromium', use: { browserName: 'chromium' } },
    { name: 'webkit', use: { ...devices['iPhone 13'], browserName: 'webkit' } },
  ],
  webServer: { command: 'npm run dev -- --host 127.0.0.1 --port 4181 --strictPort',
    url: 'http://127.0.0.1:4181/tests/persistence/blank.html', reuseExistingServer: false },
});
