import { defineConfig, devices } from "@playwright/test";

/**
 * Tests de bout en bout sur le build de production.
 * Lancer : npm run build && npm run test:e2e
 */
export default defineConfig({
  testDir: "e2e",
  timeout: 45_000,
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"]],
  use: { baseURL: "http://localhost:3100", trace: "off" },
  webServer: { command: "npx next start -p 3100", url: "http://localhost:3100", reuseExistingServer: !process.env.CI, timeout: 60_000 },
  projects: [
    { name: "ordinateur", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
});
