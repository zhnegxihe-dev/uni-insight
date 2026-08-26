import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "/uni-insight/",
  plugins: [react()],
  build: { outDir: "dist" },
});
