import { fixupConfigRules } from "@eslint/compat";
import nextConfig from "eslint-config-next";

export default fixupConfigRules([
  {
    ignores: [".next/**", "node_modules/**", "out/**", ".vercel/**", "public/**"],
  },
  ...nextConfig,
]);
