import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import fs from "node:fs";
import path from "node:path";

const root = __dirname;
const srcLogo = path.join(root, "logo.png");
const assetsDir = path.join(root, "src", "assets");
const targetLogo = path.join(assetsDir, "logo.png");

if (fs.existsSync(srcLogo)) {
  if (!fs.existsSync(assetsDir)) {
    fs.mkdirSync(assetsDir, { recursive: true });
  }
  fs.copyFileSync(srcLogo, targetLogo);
}

export default defineConfig({
  plugins: [react()],
  clearScreen: false,
  server: {
    port: 5173,
    strictPort: true,
  },
});

