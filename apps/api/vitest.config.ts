import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["test/**/*.test.ts"],
    globalSetup: ["test/helpers/global-setup.ts"],
    fileParallelism: false,
    testTimeout: 20_000,
    hookTimeout: 120_000,
    coverage: {
      provider: "v8",
      include: ["src/domain/**"],
    },
  },
});
