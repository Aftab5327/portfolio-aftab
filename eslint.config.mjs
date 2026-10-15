// ESLint 9 flat config (Next 16 removed `next lint`; `npm run lint` runs `eslint .`).
import { defineConfig, globalIgnores } from "eslint/config";
import nextCoreWebVitals from "eslint-config-next/core-web-vitals";

export default defineConfig([
  // Same scope as `next lint` had: app code, not generated output or vendored assets.
  globalIgnores([".next/**", "out/**", "build/**", "coverage/**", "public/**", "next-env.d.ts", "**/*.d.ts"]),
  {
    extends: [...nextCoreWebVitals]
  }
]);
