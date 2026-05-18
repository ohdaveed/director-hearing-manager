import path from "path";
import { defineConfig } from "vite-plus";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
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
  },
  lint: {
    ignorePatterns: [
      ".agents/**", // Blocks the linter from looking inside the .agents folder
      "dist/**",
    ],
  },
});
