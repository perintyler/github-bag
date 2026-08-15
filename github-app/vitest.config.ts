import { mergeConfig } from "vitest/config";
import base from "../../vitest.base.config.ts";

export default mergeConfig(base, {
  // The base glob is `src/**`; this bag keeps its service under `server/src`,
  // matching how bdiff lays out a bag that owns an HTTP service.
  test: { include: ["server/src/**/*.test.ts"] },
});
