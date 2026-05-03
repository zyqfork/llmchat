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
      const sw = registration.installing || registration.waiting
      if (sw) {
        sw.onstatechange = function() {
          if (sw.state === 'installed') {
            // SW installed.  Reload for SW intercept serving SW-enabled page.
            console.log('ServiceWorker installed reload page');
            window.location.reload();
          }
        }
      }
      registration.update().then(res => {
        console.log('ServiceWorker registration update: ', res);
      });
      window._SW_ENABLED = true
    }, function (err) {
      console.error('ServiceWorker registration failed: ', err);
    });
    navigator.serviceWorker.addEventListener('controllerchange', function() {
      console.log('ServiceWorker controllerchange ');
      window.location.reload(true);
    });
  });
} else if (isTauriApp) {
  console.log('Running in Tauri app, ServiceWorker is not needed');
  window._SW_ENABLED = false;
}
