import { defineConfig, devices } from '@playwright/test';
import { loadEnv } from 'vite';

// Load local E2E settings before resolving test and web server configuration.
const localEnv = loadEnv('e2e', __dirname, ['EASEMOB_', 'E2E_', 'CALLKIT_', 'HF_HOME']);
for (const [key, value] of Object.entries(localEnv)) {
  if (process.env[key] === undefined) {
    process.env[key] = value;
  }
}

const baseURL = process.env.E2E_BASE_URL ?? 'http://127.0.0.1:5175';

export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 180_000,
  expect: { timeout: 30_000 },
  workers: 1,
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  outputDir: 'test-results/artifacts',
  reporter: [
    ['list'],
    ['json', { outputFile: 'test-results/results.json' }],
    ['html', { open: 'never' }],
  ],
  use: {
    baseURL,
    headless: true,
    permissions: ['camera', 'microphone'],
    trace: 'off',
    screenshot: 'off',
    video: 'off',
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        launchOptions: {
          args: [
            '--use-fake-device-for-media-stream',
            '--use-fake-ui-for-media-stream',
            '--autoplay-policy=no-user-gesture-required',
          ],
        },
      },
    },
  ],
  webServer: !process.env.E2E_BASE_URL
    ? {
        command: 'npm run dev:demo -- --force --host 127.0.0.1 --port 5175 --strictPort',
        url: `${baseURL}/demo/callkit/call-demo.html`,
        reuseExistingServer: false,
        timeout: 120_000,
      }
    : undefined,
});
