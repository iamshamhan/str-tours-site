import { defineConfig } from "@playwright/test";
import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());
export default defineConfig({
  testDir: "./tests/smoke",
  timeout: 90000,
  workers: 1,
  reporter: "list",
  use: {
    baseURL: "http://localhost:3113",
    viewport: { width: 390, height: 844 },
    trace: "off",
    screenshot: "off",
    video: "off",
  },
  webServer: {
    command: "npm run dev -- --port 3113",
    url: "http://localhost:3113",
    reuseExistingServer: false,
    timeout: 180000,
    env: {
      NEXT_DIST_DIR: ".next-smoke",
      NEXT_PUBLIC_TURNSTILE_SITE_KEY: "1x00000000000000000000AA",
      TURNSTILE_SECRET_KEY: "1x0000000000000000000000000000000AA",
    },
  },
});
