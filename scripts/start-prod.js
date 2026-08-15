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

child.on("error", (err) => {
  console.error(`Failed to start production server: ${err.message}`);
  process.exit(1);
});

child.on("exit", (code, signal) => {
  // Windows 不支持把信号转发给自身进程，统一以退出码收尾
  const exitCode = code ?? (signal ? 1 : 0);
  if (exitCode !== 0) {
    console.error("");
    console.error("Server exited with a non-zero code.");
    console.error("If the port is already in use, set a different one via the PORT environment variable.");
  }
  process.exit(exitCode);
});
