import tauriConfig from "../../src-tauri/tauri.conf.json";

export const getBuildConfig = () => {
  if (typeof process === "undefined") {
    throw Error(
      "[Server Config] you are importing a nodejs-only module outside of nodejs",
    );
  }

  const buildMode = process.env.BUILD_MODE || "standalone";
  const isApp = process.env.BUILD_APP === "1";
  // Tauri 2.x: version is at root level
  const version = "v" + (tauriConfig.version || "0.0.0");

  // Turbopack export mode does not support dynamic require-based module loading.
  // Allow CI to inject these via environment variables and keep deterministic fallback.
  const commitInfo = {
    commitDate: process.env.BUILD_COMMIT_DATE || "unknown",
    commitHash: process.env.BUILD_COMMIT_HASH || "unknown",
  };

  return {
    version,
    ...commitInfo,
    buildMode,
    isApp,
    template: "{{input}}",
  };
};

export type BuildConfig = ReturnType<typeof getBuildConfig>;
