import js from "@eslint/js";
import globals from "globals";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";
import boundaries from "eslint-plugin-boundaries";

export default tseslint.config(
  {
    ignores: [
      ".agents/**",
      "dist/**",
      "coverage",
      "node_modules",
      "scripts/**",
      "vite.config.ts",
      "supabase/functions/**",
      "tailwind.config.ts",
    ],
  },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        project: ["./tsconfig.json", "./tsconfig.node.json"],
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      react,
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
      boundaries: boundaries,
    },
    settings: {
      "boundaries/elements": [
        {
          type: "ui",
          pattern: "src/components/ui/**/*.tsx",
        },
        {
          type: "component",
          pattern: "src/components/**/*.tsx",
          exclude: ["src/components/ui/**/*.tsx"],
        },
        {
          type: "page",
          pattern: "src/pages/**/*.tsx",
        },
        {
          type: "service",
          pattern: "src/services/**/*.ts",
        },
        {
          type: "hook",
          pattern: "src/hooks/**/*.ts",
        },
        {
          type: "utils",
          pattern: "src/utils/**/*.ts",
        },
      ],
      "boundaries/ignore": ["**/*.test.ts", "**/*.test.tsx"],
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
      // Boundaries rules (v6 syntax)
      "boundaries/no-unknown-files": "error",
      "boundaries/dependencies": [
        "error",
        {
          default: "allow",
          rules: [
            {
              from: { type: "ui" },
              disallow: [{ to: { type: "component" } }, { to: { type: "page" } }],
              message:
                "UI primitives should not depend on composite components or pages ({{from.type}} -> {{to.type}})",
            },
            {
              from: { type: "component" },
              disallow: [{ to: { type: "page" } }],
              message: "Components should not depend on pages ({{from.type}} -> {{to.type}})",
            },
          ],
        },
      ],

      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "react",
              importNames: ["default"],
              message: "Use named imports from react instead",
            },
          ],
        },
      ],

      // Sync rules from vite.config.ts
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
      "no-console": ["warn", { allow: ["warn", "error"] }],
      "prefer-const": "error",
      "no-var": "error",
      "@typescript-eslint/no-explicit-any": "warn",
    },
  },
);
