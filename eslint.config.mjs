import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Plain JS utility scripts (CommonJS, not part of the app bundle)
    "scripts/rebrand-colors.js",
    "scripts/import-woocommerce.ts",
    // Generated Prisma client (auto-generated, not hand-written)
    "generated/**",
  ]),
]);

export default eslintConfig;
