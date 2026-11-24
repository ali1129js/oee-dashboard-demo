import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "node:path";

const alias = { "@": path.resolve(__dirname, "src") };

export default defineConfig({
  plugins: [react()],
  base: "./",
  resolve: { alias },
  server: { port: 5175, strictPort: true },
  preview: { port: 4175, strictPort: true },
  build: { outDir: "dist" },
  test: {
    globals: true,
    setupFiles: ["src/test/setup.ts"],
    // vitest 4 removed environmentMatchGlobs: one project per environment.
    projects: [
      {
        extends: true,
        test: { name: "logic", environment: "node", include: ["src/**/*.test.ts"] },
      },
      {
        extends: true,
        test: { name: "ui", environment: "jsdom", include: ["src/**/*.test.tsx"] },
      },
    ],
  },
});
