import tauriConfig from "../../src-tauri/tauri.conf.json";
import packageJson from "../../package.json";

export const getBuildConfig = () => {
  if (typeof process === "undefined") {
    throw Error(
      "[Server Config] you are importing a nodejs-only module outside of nodejs",
    );
  }

  const buildMode = process.env.BUILD_MODE || "standalone";
  const isApp = process.env.BUILD_APP === "1";
  const appRuntime = process.env.BUILD_APP_RUNTIME || "";
  const envTag = process.env.BUILD_APP_VERSION?.trim();
  // Docker / CI：与 Git Release tag 对齐；否则读 Tauri 配置（桌面构建）
  const version =
    envTag && envTag.length > 0
      ? envTag.startsWith("v")
        ? envTag
        : `v${envTag}`
      : "v" +
        (appRuntime === "electron"
          ? packageJson.version
          : tauriConfig.version || "0.0.0");

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
    appRuntime,
    isApp,
    template: "{{input}}",
  };
};

export type BuildConfig = ReturnType<typeof getBuildConfig>;
