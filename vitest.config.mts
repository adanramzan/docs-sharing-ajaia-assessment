import { loadEnv } from "vite";
import { defineConfig } from "vitest/config";

// Load DATABASE_URL from .env.local, same as `next dev`.
export default defineConfig({
  test: { environment: "node", include: ["tests/**/*.test.ts"], env: loadEnv("", process.cwd(), "") },
});
