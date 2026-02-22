import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const STATE_DIR = join(process.cwd(), ".promptpad");
const REGISTRY_PATH = join(STATE_DIR, "dev-processes.json");

function ensureStateDir() {
  mkdirSync(STATE_DIR, { recursive: true });
}

function isRunning(pid) {
  if (!Number.isInteger(pid) || pid <= 0) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

export function loadRegistry() {
  ensureStateDir();

  try {
    const raw = readFileSync(REGISTRY_PATH, "utf8");
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter((entry) => entry && Number.isInteger(entry.pid))
      .map((entry) => ({
        pid: entry.pid,
        command: typeof entry.command === "string" ? entry.command : "",
        startedAt: typeof entry.startedAt === "string" ? entry.startedAt : "",
      }));
  } catch {
    return [];
  }
}

export function saveRegistry(entries) {
  ensureStateDir();
  writeFileSync(REGISTRY_PATH, `${JSON.stringify(entries, null, 2)}\n`, "utf8");
}

export function pruneRegistry(entries) {
  const nextEntries = entries.filter((entry) => isRunning(entry.pid));
  if (nextEntries.length !== entries.length) {
    saveRegistry(nextEntries);
  }
  return nextEntries;
}

export function addPid(pid, command) {
  const entries = pruneRegistry(loadRegistry());
  const nextEntries = [
    ...entries,
    {
      pid,
      command,
      startedAt: new Date().toISOString(),
    },
  ];
  saveRegistry(nextEntries);
}

export function removePid(pid) {
  const entries = loadRegistry();
  const nextEntries = entries.filter((entry) => entry.pid !== pid);
  saveRegistry(nextEntries);
}
