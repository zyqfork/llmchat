// 检查是否在 Tauri 环境中运行
const isTauriApp = typeof window !== 'undefined' && window.__TAURI__ !== undefined;

// Electron 等 file:// 页面无法以根路径注册 SW，且不需要离线缓存
const isFileProtocol =
  typeof window !== "undefined" && window.location.protocol === "file:";

// Tauri 应用不需要 ServiceWorker
if (!isTauriApp && !isFileProtocol && "serviceWorker" in navigator) {
  window.addEventListener("DOMContentLoaded", function () {
    navigator.serviceWorker
      .register("/serviceWorker.js")
      .then(function (registration) {
      console.log('ServiceWorker registration successful with scope: ', registration.scope);
      // 静默更新检查。SW 仅用于 /api/cache 文件缓存（见 serviceWorker.js），
      // 新版安装后由 skipWaiting + controllerchange 自然接管，无需强制刷新页面，
      // 避免首次访问时因 reload 打断用户。
      registration.update().catch(function (err) {
        console.error('ServiceWorker update check failed: ', err);
      });
      window._SW_ENABLED = true
    }, function (err) {
      console.error('ServiceWorker registration failed: ', err);
    });
  });
} else if (isTauriApp) {
  console.log('Running in Tauri app, ServiceWorker is not needed');
  window._SW_ENABLED = false;
}