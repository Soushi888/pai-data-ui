import { dirname, resolve } from "node:path";
import { spawn } from "bun";

const PORT = process.env.PORT ?? "4173";

// When compiled: import.meta.dir is /$bunfs/root (virtual FS); use process.execPath for real path.
// When run via `bun scripts/launcher.ts`: import.meta.dir is the real scripts/ directory.
const PROJECT_DIR = import.meta.dir.startsWith("/$bunfs/")
  ? dirname(process.execPath)
  : resolve(import.meta.dir, "..");
const SERVER_ENTRY = resolve(PROJECT_DIR, "build", "index.js");

// adapter-node output uses better-sqlite3 which requires Node.js (not Bun).
// NODE_PATH is injected by the systemd service (via install.sh) to survive systemd's minimal PATH.
const NODE = process.env.NODE_PATH ?? "node";

const proc = spawn([NODE, SERVER_ENTRY], {
  env: { ...process.env, PORT },
  stdout: "inherit",
  stderr: "inherit",
});

console.log(`PAI Data UI running at http://localhost:${PORT}`);

function shutdown() {
  proc.kill("SIGTERM");
  process.exit(0);
}

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

await proc.exited;
