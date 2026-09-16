import { defineConfig } from "vitest/config";

// Standalone, not a merge of the monorepo's vitest.base.config.ts. That import
// came along when this bag was extracted from the barry checkout and has been
// dead ever since — ../../vitest.base.config.ts has never existed here, so
// `pnpm test` failed at config load and ran nothing. The base config's other
// half pins a test database; this app touches no database, so the include glob
// below is all of it that ever applied.
export default defineConfig({
  test: {
    // This bag keeps its service under server/src, matching how bdiff lays out
    // a bag that owns an HTTP service.
    include: ["server/src/**/*.test.ts"],
    env: { LOG_LEVEL: "silent" },
  },
});
