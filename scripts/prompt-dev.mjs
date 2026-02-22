import { spawn } from "node:child_process";
import { mkdirSync } from "node:fs";
import os from "node:os";
import { basename, join } from "node:path";
import {
  addPid,
  loadRegistry,
  pruneRegistry,
  removePid,
} from "./dev-process-registry.mjs";

const PROJECT_SLUG = basename(process.cwd());
const command = process.platform === "win32" ? "pnpm.cmd" : "pnpm";
const cliArgs = new Set(process.argv.slice(2));
const args = ["tauri", "dev"];

if (cliArgs.has("--no-watch")) {
  args.push("--no-watch");
}

if (cliArgs.has("--verbose")) {
  args.push("--verbose");
}

function resolveDefaultCargoTargetDir() {
  if (process.platform === "darwin") {
    return join(
      os.homedir(),
      "Library",
      "Caches",
      "promptpad-dev",
      PROJECT_SLUG,
      "tauri-target",
    );
  }

  if (process.platform === "win32") {
    return join(
      process.env.LOCALAPPDATA ?? join(os.homedir(), "AppData", "Local"),
      "promptpad-dev",
      PROJECT_SLUG,
      "tauri-target",
    );
  }

  return join(os.homedir(), ".cache", "promptpad-dev", PROJECT_SLUG, "tauri-target");
}

const childEnv = {
  ...process.env,
  CARGO_TARGET_DIR: process.env.CARGO_TARGET_DIR ?? resolveDefaultCargoTargetDir(),
};

if (cliArgs.has("--open-devtools")) {
  childEnv.PROMPTPAD_OPEN_DEVTOOLS = "1";
}

mkdirSync(childEnv.CARGO_TARGET_DIR, { recursive: true });
console.log(`[prompt] CARGO_TARGET_DIR=${childEnv.CARGO_TARGET_DIR}`);

const active = pruneRegistry(loadRegistry());
if (active.length > 0) {
  const pids = active.map((entry) => entry.pid).join(", ");
  console.warn(
    `[prompt] Existing tracked dev process(es): ${pids}. Run \`pnpm run prompt:hard-reset\` if startup is blocked.`,
  );
}

const child = spawn(command, args, {
  stdio: "inherit",
  shell: process.platform === "win32",
  env: childEnv,
});

if (!child.pid) {
  console.error("[prompt] Failed to start tauri dev process.");
  process.exit(1);
}

addPid(child.pid, `${command} ${args.join(" ")}`);

let shuttingDown = false;

const cleanupAndExit = (code) => {
  if (shuttingDown) return;
  shuttingDown = true;
  removePid(child.pid);
  process.exit(code);
};

const forwardSignal = (signal) => {
  if (!child.killed) {
    child.kill(signal);
  }
};

process.on("SIGINT", () => forwardSignal("SIGINT"));
process.on("SIGTERM", () => forwardSignal("SIGTERM"));

child.on("error", (error) => {
  console.error(`[prompt] Failed to spawn tauri dev: ${error.message}`);
  cleanupAndExit(1);
});

child.on("exit", (code, signal) => {
  if (signal) {
    cleanupAndExit(1);
    return;
  }
  cleanupAndExit(code ?? 0);
});
