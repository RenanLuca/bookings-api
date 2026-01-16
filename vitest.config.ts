import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    fileParallelism: false,
    testTimeout: 10000,
    hookTimeout: 10000,
    setupFiles: ["./tests/setup.ts"],
    include: ["tests/**/*.spec.ts"],
    typecheck: {
      tsconfig: "./tsconfig.test.json"
    }
  }
});
