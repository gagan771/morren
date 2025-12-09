import { fixupConfigRules } from "@eslint/compat";
import nextPlugin from "eslint-config-next";

export default fixupConfigRules([
  {
    ignores: [".next/**", "node_modules/**", "out/**", ".vercel/**", "public/**"],
  },
  ...nextPlugin,
]);
