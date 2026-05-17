import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [tailwindcss()],
  css: {
    // ❌ Remove or avoid: transformer: 'lightningcss'
    // Pure LightningCSS transformer will choke on Tailwind v4 syntax

    //  Keep this for minification (it runs AFTER Tailwind compiles)
    minify: "lightningcss",
  },
  build: {
    chunkSizeWarningLimit: 600, // Optional: slightly raise the warning threshold
    rollupOptions: {
      output: {
        // Automatically splits node_modules into their own chunks
        manualChunks(id) {
          if (id.includes("node_modules")) {
            // Returns the name of the package to group them logically
            return id
              .toString()
              .split("node_modules/")[1]
              .split("/")[0]
              .toString();
          }
        },
      },
    },
  },
});
