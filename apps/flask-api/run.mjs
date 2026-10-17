import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(import.meta.url));
const isWindows = process.platform === "win32";
const venvPython = join(
  root,
  ".venv",
  isWindows ? "Scripts" : "bin",
  isWindows ? "python.exe" : "python",
);
const python = existsSync(venvPython) ? venvPython : "python";

const result = spawnSync(
  python,
  ["-m", "flask", "--app", "app", "run", "--debug", "--port", "5001"],
  { cwd: root, stdio: "inherit" },
);

process.exit(result.status ?? 1);
