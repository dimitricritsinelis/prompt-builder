import { execFile } from "node:child_process";
import { basename } from "node:path";
import { promisify } from "node:util";
import treeKill from "tree-kill";
import killPort from "kill-port";
import { loadRegistry, pruneRegistry, removePid, saveRegistry } from "./dev-process-registry.mjs";

const execFileAsync = promisify(execFile);

function killPidTree(pid) {
  return new Promise((resolve) => {
    treeKill(pid, "SIGTERM", (termError) => {
      if (!termError) {
        resolve();
        return;
      }

      treeKill(pid, "SIGKILL", () => {
        resolve();
      });
    });
  });
}

async function listProcesses() {
  if (process.platform === "win32") {
    const { stdout } = await execFileAsync("powershell", [
      "-NoProfile",
      "-Command",
      "Get-CimInstance Win32_Process | Select-Object ProcessId,CommandLine | ConvertTo-Json -Compress",
    ]);

    if (!stdout.trim()) return [];

    const parsed = JSON.parse(stdout);
    const entries = Array.isArray(parsed) ? parsed : [parsed];

    return entries
      .map((entry) => ({
        pid: Number(entry?.ProcessId),
        command: String(entry?.CommandLine ?? ""),
      }))
      .filter((entry) => Number.isInteger(entry.pid) && entry.pid > 0);
  }

  const { stdout } = await execFileAsync("ps", ["-ax", "-o", "pid=", "-o", "command="]);

  return stdout
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const match = line.match(/^(\d+)\s+(.*)$/);
      if (!match) return null;

      return {
        pid: Number(match[1]),
        command: match[2],
      };
    })
    .filter((entry) => entry && Number.isInteger(entry.pid) && entry.pid > 0);
}

function matchesFallbackProcess(command) {
  const normalized = command.toLowerCase();
  const workspace = process.cwd().replaceAll("\\", "/").toLowerCase();
  const workspaceName = basename(process.cwd()).toLowerCase();

  const inWorkspace =
    normalized.includes(workspace) ||
    normalized.includes(`/` + workspaceName) ||
    normalized.includes(`\\` + workspaceName);

  const isTauriBinary =
    normalized.includes("target/debug/tauri-app") || normalized.includes("target\\debug\\tauri-app");
  const isViteDev = normalized.includes("vite --host 127.0.0.1 --strictport");
  const isCargoDev =
    normalized.includes("cargo run --no-default-features") ||
    normalized.includes("cargo  run --no-default-features");
  const isTauriDev = normalized.includes("tauri dev");

  if (isTauriBinary || isViteDev) {
    return true;
  }

  return inWorkspace && (isCargoDev || isTauriDev);
}

async function killFallbackProcesses(alreadyStopped) {
  let killedCount = 0;

  try {
    const processes = await listProcesses();

    for (const entry of processes) {
      if (!entry) continue;
      if (entry.pid === process.pid) continue;
      if (alreadyStopped.has(entry.pid)) continue;
      if (entry.command.includes("prompt-hard-reset.mjs")) continue;

      if (!matchesFallbackProcess(entry.command)) continue;

      await killPidTree(entry.pid);
      alreadyStopped.add(entry.pid);
      killedCount += 1;
      console.log(`[prompt:hard-reset] Fallback stopped PID ${entry.pid}`);
    }
  } catch (error) {
    console.warn(`[prompt:hard-reset] Fallback process scan failed: ${String(error)}`);
  }

  return killedCount;
}

async function main() {
  const active = pruneRegistry(loadRegistry());
  const stopped = new Set();

  for (const entry of active) {
    await killPidTree(entry.pid);
    removePid(entry.pid);
    stopped.add(entry.pid);
    console.log(`[prompt:hard-reset] Stopped tracked PID ${entry.pid}`);
  }

  await killFallbackProcesses(stopped);

  try {
    await killPort(1420);
    console.log("[prompt:hard-reset] Cleared port 1420.");
  } catch {
    console.log("[prompt:hard-reset] Port 1420 was already free.");
  }

  saveRegistry([]);
}

void main();
