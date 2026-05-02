const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");

const root = process.cwd();
const standaloneServer = path.join(root, ".next", "standalone", "server.js");

if (!fs.existsSync(standaloneServer)) {
  console.error("Missing production server file:");
  console.error(`  ${standaloneServer}`);
  console.error("");
  console.error("Run a standalone build first:");
  console.error("  yarn build");
  process.exit(1);
}

const child = spawn(
  process.execPath,
  ["--no-deprecation", standaloneServer],
  { stdio: "inherit", env: process.env },
);

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 0);
});
