import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
  build: {
    target: "es2022",
    sourcemap: false,
    chunkSizeWarningLimit: 1800,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return;
          if (id.includes("@dimforge") || id.includes("rapier")) return "rapier";
          if (id.includes("@react-three")) return "r3f";
          if (id.includes("/three/")) return "three";
          if (id.includes("recharts") || id.includes("/d3-") || id.includes("victory-vendor"))
            return "charts";
          if (id.includes("framer-motion") || id.includes("motion-dom") || id.includes("motion-utils"))
            return "motion";
          if (id.includes("troika") || id.includes("bidi-js") || id.includes("webgl-sdf"))
            return "text3d";
        },
      },
    },
  },
});
