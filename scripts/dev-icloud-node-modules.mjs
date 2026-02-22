import { lstat, mkdir, readlink, realpath, rename, symlink } from "node:fs/promises";
import os from "node:os";
import { basename, dirname, join, resolve } from "node:path";

const PROJECT_SLUG = basename(process.cwd());
const REPO_NODE_MODULES = join(process.cwd(), "node_modules");
const REPO_PNPM_DIR = join(REPO_NODE_MODULES, ".pnpm");
const CACHE_PNPM_DIR = join(
  os.homedir(),
  "Library",
  "Caches",
  "promptpad-dev",
  PROJECT_SLUG,
  "node_modules",
  ".pnpm",
);

function stamp() {
  return new Date().toISOString().replaceAll(":", "-");
}

async function lstatOrNull(targetPath) {
  try {
    return await lstat(targetPath);
  } catch {
    return null;
  }
}

async function moveAside(targetPath, reasonLabel) {
  const backupPath = `${targetPath}.backup.${stamp()}`;
  await rename(targetPath, backupPath);
  console.log(`[dev:icloud-fix] Moved ${reasonLabel} to ${backupPath}`);
}

async function isSymlinkToTarget(linkPath, targetPath) {
  const stat = await lstatOrNull(linkPath);
  if (!stat?.isSymbolicLink()) return false;

  const linkTarget = await readlink(linkPath);
  const absoluteTarget = resolve(dirname(linkPath), linkTarget);
  const resolvedTarget = await realpath(absoluteTarget).catch(() => absoluteTarget);
  const resolvedExpectedTarget = await realpath(targetPath).catch(() => targetPath);

  return resolvedTarget === resolvedExpectedTarget;
}

async function ensureCompatibleNodeModulesRoot() {
  const stat = await lstatOrNull(REPO_NODE_MODULES);
  if (!stat) {
    await mkdir(REPO_NODE_MODULES, { recursive: true });
    return;
  }

  if (stat.isSymbolicLink()) {
    await moveAside(REPO_NODE_MODULES, "legacy node_modules symlink");
    await mkdir(REPO_NODE_MODULES, { recursive: true });
    return;
  }

  if (!stat.isDirectory()) {
    await moveAside(REPO_NODE_MODULES, "non-directory node_modules entry");
    await mkdir(REPO_NODE_MODULES, { recursive: true });
  }
}

async function main() {
  if (process.platform !== "darwin") {
    console.log("[dev:icloud-fix] Non-macOS platform detected, skipping iCloud Desktop fix.");
    return;
  }

  await ensureCompatibleNodeModulesRoot();
  await mkdir(CACHE_PNPM_DIR, { recursive: true });

  if (await isSymlinkToTarget(REPO_PNPM_DIR, CACHE_PNPM_DIR)) {
    console.log("[dev:icloud-fix] node_modules/.pnpm already points to local cache.");
    console.log(`[dev:icloud-fix] Cache location: ${CACHE_PNPM_DIR}`);
    console.log("[dev:icloud-fix] Run `pnpm install` if dependencies are missing.");
    return;
  }

  const existingPnpmDir = await lstatOrNull(REPO_PNPM_DIR);
  if (existingPnpmDir?.isDirectory()) {
    await moveAside(REPO_PNPM_DIR, "existing node_modules/.pnpm directory");
  } else if (existingPnpmDir?.isSymbolicLink()) {
    await moveAside(REPO_PNPM_DIR, "existing node_modules/.pnpm symlink");
  }

  await symlink(CACHE_PNPM_DIR, REPO_PNPM_DIR, "dir");

  console.log(`[dev:icloud-fix] Linked ${REPO_PNPM_DIR}`);
  console.log(`[dev:icloud-fix]          -> ${CACHE_PNPM_DIR}`);
  console.log("[dev:icloud-fix] Next step: run `pnpm install`.");
}

void main();
