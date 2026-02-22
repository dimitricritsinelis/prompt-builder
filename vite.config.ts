import { existsSync, realpathSync } from "node:fs";
import { join } from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// @ts-expect-error process is a nodejs global
const host = process.env.TAURI_DEV_HOST;
const workspaceRoot = process.cwd();
const pnpmDir = join(workspaceRoot, "node_modules", ".pnpm");
const fsAllow = [workspaceRoot];

if (existsSync(pnpmDir)) {
  try {
    fsAllow.push(realpathSync(pnpmDir));
  } catch {
    // Keep default allow list when .pnpm cannot be resolved.
  }
}

// https://vite.dev/config/
export default defineConfig(async () => ({
  plugins: [react()],
  worker: {
    format: "es",
  },

  // Vite options tailored for Tauri development and only applied in `tauri dev` or `tauri build`
  //
  // 1. prevent Vite from obscuring rust errors
  clearScreen: false,
  // 2. tauri expects a fixed port, fail if that port is not available
  server: {
    port: 1420,
    strictPort: true,
    host: host || false,
    fs: {
      allow: fsAllow,
    },
    hmr: host
      ? {
          protocol: "ws",
          host,
          port: 1421,
        }
      : undefined,
    watch: {
      // 3. tell Vite to ignore watching `src-tauri`
      ignored: ["**/src-tauri/**"],
    },
  },
}));
