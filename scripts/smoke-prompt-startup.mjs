import { spawn } from "node:child_process";
import treeKill from "tree-kill";
import { addPid, removePid } from "./dev-process-registry.mjs";

const command = process.platform === "win32" ? "pnpm.cmd" : "pnpm";
const args = ["tauri", "dev", "--no-watch"];
const startupTimeoutMs = 7 * 60 * 1000;
const gracefulShutdownTimeoutMs = 8_000;

function waitForExit(child, timeoutMs) {
  if (child.exitCode !== null || child.signalCode !== null) {
    return Promise.resolve(true);
  }

  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      child.off("exit", onExit);
      resolve(false);
    }, timeoutMs);

    const onExit = () => {
      clearTimeout(timeout);
      resolve(true);
    };

    child.once("exit", onExit);
  });
}

function killTree(pid, signal) {
  return new Promise((resolve) => {
    treeKill(pid, signal, () => resolve());
  });
}

async function main() {
  const child = spawn(command, args, {
    stdio: ["ignore", "pipe", "pipe"],
    shell: process.platform === "win32",
    env: {
      ...process.env,
      CI: "1",
    },
  });

  if (!child.pid || !child.stdout || !child.stderr) {
    throw new Error("Failed to start tauri dev process for smoke test.");
  }

  addPid(child.pid, `${command} ${args.join(" ")}`);

  let output = "";
  let startupMarkerSeen = false;
  let appMarkerSeen = false;
  let finalized = false;

  let resolveDone;
  let rejectDone;

  const done = new Promise((resolve, reject) => {
    resolveDone = resolve;
    rejectDone = reject;
  });

  const startupTimeout = setTimeout(() => {
    void finalize(false, "Timed out waiting for startup markers.");
  }, startupTimeoutMs);

  const maybeFinalizeSuccess = () => {
    if (startupMarkerSeen && appMarkerSeen) {
      void finalize(true, "");
    }
  };

  const gracefulShutdown = async () => {
    if (child.exitCode !== null || child.signalCode !== null) {
      return { ok: true, escalated: false };
    }

    child.kill("SIGINT");
    const exitedGracefully = await waitForExit(child, gracefulShutdownTimeoutMs);

    if (exitedGracefully) {
      return { ok: true, escalated: false };
    }

    await killTree(child.pid, "SIGKILL");
    await waitForExit(child, 3_000);
    return { ok: false, escalated: true };
  };

  const finalize = async (ok, reason) => {
    if (finalized) return;
    finalized = true;

    clearTimeout(startupTimeout);

    try {
      const shutdown = await gracefulShutdown();

      if (!ok) {
        rejectDone(new Error(reason));
        return;
      }

      if (shutdown.escalated || !shutdown.ok) {
        rejectDone(new Error("Smoke startup reached markers but shutdown required forced kill."));
        return;
      }

      resolveDone();
    } finally {
      removePid(child.pid);
    }
  };

  const processOutputChunk = (chunk, write) => {
    const text = chunk.toString();
    write(text);

    output = `${output}${text}`.slice(-24_000);

    if (!startupMarkerSeen && output.includes("Local:   http://127.0.0.1:1420/")) {
      startupMarkerSeen = true;
    }

    if (
      !appMarkerSeen &&
      (output.includes("target/debug/tauri-app") || output.includes("target\\debug\\tauri-app"))
    ) {
      appMarkerSeen = true;
    }

    maybeFinalizeSuccess();
  };

  child.stdout.on("data", (chunk) => {
    processOutputChunk(chunk, (text) => process.stdout.write(text));
  });

  child.stderr.on("data", (chunk) => {
    processOutputChunk(chunk, (text) => process.stderr.write(text));
  });

  child.on("exit", (code) => {
    if (finalized) return;
    void finalize(false, `Prompt smoke exited early with code ${code ?? "unknown"}.`);
  });

  await done;
}

main()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error(`[smoke] ${error.message}`);
    process.exit(1);
  });
