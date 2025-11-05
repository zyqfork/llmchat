import { STORAGE_KEY } from "@/app/constant";
import { SyncStore } from "@/app/store/sync";
import { getProxyUrl, isTauriApp, tauriFetch } from "@/app/utils/tauri-proxy";

export type WebDAVConfig = SyncStore["webdav"];
export type WebDavClient = ReturnType<typeof createWebDavClient>;

export function createWebDavClient(store: SyncStore) {
  const folder = STORAGE_KEY;
  const fileName = `${folder}/backup.json`;
  const config = store.webdav;
  // 使用统一的 getProxyUrl 函数
  // 在 Tauri 环境中会返回空字符串（使用 stream_fetch 命令）
  const proxyUrl = getProxyUrl(store.useProxy, store.proxyUrl);

  // 在 Tauri 环境中使用 tauriFetch，否则使用普通 fetch
  const useTauriFetch = isTauriApp() && store.useProxy;
  const fetchFn = useTauriFetch ? tauriFetch : fetch;

  if (useTauriFetch) {
    console.log("[WebDav] Using Tauri fetch (proxy_fetch command)");
  } else if (store.useProxy) {
    console.log("[WebDav] Using proxy URL:", proxyUrl);
  } else {
    console.log("[WebDav] Direct connection (no proxy)");
  }

  return {
    async check() {
      try {
        const res = await fetchFn(this.path(folder, proxyUrl, "MKCOL"), {
          method: "GET",
          headers: this.headers(),
        });
        const success = [201, 200, 404, 405, 301, 302, 307, 308].includes(
          res.status,
        );
        console.log(
          `[WebDav] check ${success ? "success" : "failed"}, ${res.status} ${
            res.statusText
          }`,
        );
        return success;
      } catch (e) {
        console.error("[WebDav] failed to check", e);
      }

      return false;
    },

    async get(key: string) {
      const res = await fetchFn(this.path(fileName, proxyUrl), {
        method: "GET",
        headers: this.headers(),
      });

      console.log("[WebDav] get key = ", key, res.status, res.statusText);

      if (404 == res.status) {
        return "";
      }

      return await res.text();
    },

    async set(key: string, value: string) {
      const res = await fetchFn(this.path(fileName, proxyUrl), {
        method: "PUT",
        headers: this.headers(),
        body: value,
      });

      console.log("[WebDav] set key = ", key, res.status, res.statusText);
    },

    headers() {
      const auth = btoa(config.username + ":" + config.password);

      return {
        authorization: `Basic ${auth}`,
      };
    },
    path(path: string, proxyUrl: string = "", proxyMethod: string = "") {
      if (path.startsWith("/")) {
        path = path.slice(1);
      }

      // 如果没有启用代理或代理 URL 为空，直接使用 WebDAV 端点
      if (!proxyUrl) {
        let endpoint = config.endpoint;
        if (!endpoint.endsWith("/")) {
          endpoint += "/";
        }
        return endpoint + path;
      }

      if (proxyUrl.endsWith("/")) {
        proxyUrl = proxyUrl.slice(0, -1);
      }

      let url;
      const pathPrefix = "/api/webdav/";

      try {
        let u = new URL(proxyUrl + pathPrefix + path);
        // add query params
        u.searchParams.append("endpoint", config.endpoint);
        proxyMethod && u.searchParams.append("proxy_method", proxyMethod);
        url = u.toString();
      } catch (e) {
        url = pathPrefix + path + "?endpoint=" + config.endpoint;
        if (proxyMethod) {
          url += "&proxy_method=" + proxyMethod;
        }
      }

      return url;
    },
  };
}
