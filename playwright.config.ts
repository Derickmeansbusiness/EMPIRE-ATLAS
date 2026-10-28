import { defineConfig, devices } from "@playwright/test";
import fs from "node:fs";

// Allow a pre-installed Chromium (e.g. CI images) via PLAYWRIGHT_CHROMIUM_PATH; otherwise Playwright's own download is used.
const executablePath = process.env.PLAYWRIGHT_CHROMIUM_PATH && fs.existsSync(process.env.PLAYWRIGHT_CHROMIUM_PATH) ? process.env.PLAYWRIGHT_CHROMIUM_PATH : undefined;

const PORT = Number(process.env.E2E_PORT ?? 3100);

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 60_000,
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [["list"]],
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    trace: "retain-on-failure",
    launchOptions: executablePath ? { executablePath } : {},
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
  webServer: {
    command: `pnpm exec tsx scripts/e2e-server.ts`,
    url: `http://127.0.0.1:${PORT}/`,
    reuseExistingServer: false,
    timeout: 240_000,
    stdout: "pipe",
    stderr: "pipe",
    env: { ...process.env, E2E_PORT: String(PORT) },
  },
});
