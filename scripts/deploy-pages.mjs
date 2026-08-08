import { renameSync } from "node:fs";
import { spawnSync } from "node:child_process";

renameSync("wrangler.jsonc", "wrangler.worker.jsonc");
renameSync("wrangler.pages.jsonc", "wrangler.jsonc");

try {
  const result = spawnSync(
    "bunx",
    ["wrangler", "pages", "deploy", "--commit-dirty=true", "--branch=main"],
    { stdio: "inherit", shell: true },
  );
  process.exitCode = result.status ?? 1;
} finally {
  renameSync("wrangler.jsonc", "wrangler.pages.jsonc");
  renameSync("wrangler.worker.jsonc", "wrangler.jsonc");
}
