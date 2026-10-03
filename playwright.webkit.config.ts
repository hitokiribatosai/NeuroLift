import { defineConfig, devices } from '@playwright/test';
import base from './playwright.config';

export default defineConfig({
  ...base,
  testMatch: ['platform-layout.spec.ts', 'refinements.spec.ts'],
  use: { ...base.use, ...devices['iPhone 13'], browserName: 'webkit', channel: undefined },
});
