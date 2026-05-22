import path from "path";
import { defineConfig } from "vite-plus";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  staged: {
    "*.{ts,tsx}": ["vp lint --fix", "prettier --write"],
    "*.{json,css,md}": "prettier --write",
  },
  lint: {
    plugins: ["oxc", "typescript", "unicorn", "react"],
    categories: {
      correctness: "warn",
    },
    env: {
      builtin: true,
    },
    ignorePatterns: [".agents/**", "dist/**", "coverage", "node_modules"],
    overrides: [
      {
        files: ["**/*.{ts,tsx}"],
        rules: {
          "constructor-super": "off",
          "for-direction": "error",
          "getter-return": "off",
          "no-async-promise-executor": "error",
          "no-case-declarations": "error",
          "no-class-assign": "off",
          "no-compare-neg-zero": "error",
          "no-const-assign": "off",
          "no-debugger": "error",
          "no-delete-var": "error",
          "no-dupe-class-members": "off",
          "no-dupe-else-if": "error",
          "no-dupe-keys": "off",
          "no-duplicate-case": "error",
          "no-empty": "error",
          "no-empty-character-class": "error",
          "no-empty-pattern": "error",
          "no-empty-static-block": "error",
          "no-ex-assign": "error",
          "no-extra-boolean-cast": "error",
          "no-fallthrough": "error",
          "no-func-assign": "off",
          "no-global-assign": "error",
          "no-invalid-regexp": "error",
          "no-irregular-whitespace": "error",
          "no-loss-of-precision": "error",
          "no-misleading-character-class": "error",
          "no-new-native-nonconstructor": "off",
          "no-nonoctal-decimal-escape": "error",
          "no-obj-calls": "off",
          "no-prototype-builtins": "error",
          "no-redeclare": "off",
          "no-regex-spaces": "error",
          "no-self-assign": "error",
          "no-setter-return": "off",
          "no-shadow-restricted-names": "error",
          "no-sparse-arrays": "error",
          "no-this-before-super": "off",
          "no-undef": "off",
          "no-unexpected-multiline": "error",
          "no-unreachable": "off",
          "no-unsafe-finally": "error",
          "no-unsafe-negation": "off",
          "no-unsafe-optional-chaining": "error",
          "no-unused-labels": "error",
          "no-unused-private-class-members": "error",
          "no-unused-vars": [
            "error",
            {
              argsIgnorePattern: "^_",
              varsIgnorePattern: "^_",
              caughtErrorsIgnorePattern: "^_",
            },
          ],
          "no-useless-backreference": "error",
          "no-useless-catch": "error",
          "no-useless-escape": "error",
          "no-with": "off",
          "require-yield": "error",
          "use-isnan": "error",
          "valid-typeof": "error",
          "no-var": "error",
          "prefer-const": "error",
          "prefer-rest-params": "error",
          "prefer-spread": "error",
          "no-array-constructor": "error",
          "no-unused-expressions": "error",
          "typescript/ban-ts-comment": "error",
          "typescript/no-duplicate-enum-values": "error",
          "typescript/no-empty-object-type": "error",
          "typescript/no-explicit-any": "off",
          "typescript/no-extra-non-null-assertion": "error",
          "typescript/no-misused-new": "error",
          "typescript/no-namespace": "error",
          "typescript/no-non-null-asserted-optional-chain": "error",
          "typescript/no-require-imports": "off",
          "typescript/no-this-alias": "error",
          "typescript/no-unsafe-declaration-merging": "error",
          "typescript/no-unsafe-function-type": "error",
          "typescript/no-wrapper-object-types": "error",
          "typescript/prefer-as-const": "error",
          "typescript/prefer-namespace-keyword": "error",
          "typescript/triple-slash-reference": "error",
          "react/rules-of-hooks": "error",
          "react/exhaustive-deps": "warn",
          "react/only-export-components": "off",
        },
      },
    ],
    options: {
      typeAware: true,
      typeCheck: true,
    },
  },
  // Serve static assets (e.g. pdf.worker.min.mjs) from public/
  publicDir: "public",
  plugins: [tailwindcss()],
  css: {
    minify: "lightningcss",
  },
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
    },
  },
  build: {
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            // Isolate ultra-heavy PDF and document processing engines
            if (
              id.includes("pdfjs-dist") ||
              id.includes("@react-pdf") ||
              id.includes("mammoth") ||
              id.includes("jspdf") ||
              id.includes("html2canvas")
            ) {
              return "document-core";
            }

            // Isolate LLM and AI Cloud SDKs
            if (
              id.includes("openai") ||
              id.includes("anthropic") ||
              id.includes("generative-ai") ||
              id.includes("vertexai")
            ) {
              return "ai-core";
            }

            // Isolate charting data libraries
            if (id.includes("recharts") || id.includes("d3")) {
              return "charts-core";
            }

            // Standard framework and lightweight utilities (react, lucide, radix, etc.)
            return "framework-vendor";
          }
        },
      },
    },
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    exclude: ["e2e/**", "node_modules/**", "dist/**"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      thresholds: {
        statements: 80,
        branches: 80,
        functions: 80,
        lines: 80,
      },
      exclude: [
        "node_modules/**",
        "src/test/**",
        "**/*.d.ts",
        "**/*.test.ts",
        "**/*.test.tsx",
      ],
    },
  },
});
