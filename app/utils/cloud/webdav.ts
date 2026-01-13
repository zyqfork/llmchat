import { STORAGE_KEY } from "@/app/constant";
import { SyncStore } from "@/app/store/sync";
import { fetch, getProxyUrl, FetchType } from "@/app/utils/fetch";
import { logger } from "@/app/utils/logger";

export type WebDAVConfig = SyncStore["webdav"];
export type WebDavClient = ReturnType<typeof createWebDavClient>;

export function createWebDavClient(store: SyncStore) {
  const config = store.webdav;
  const proxyUrl = getProxyUrl(store.useProxy, store.proxyUrl);

  return {
    async check() {
      try {
        const res = await fetch(
          this.path(config.username || STORAGE_KEY, proxyUrl, "MKCOL"),
          {
            method: "GET",
            headers: this.headers(),
          },
          FetchType.Sync,
        );
        const success = [201, 200, 404, 405, 301, 302, 307, 308].includes(
          res.status,
        );
        logger.debug(
          `[WebDav] check ${success ? "success" : "failed"}, ${res.status} ${
            res.statusText
          }`,
        );
        return success;
      } catch (e) {
        logger.error("[WebDav] failed to check", e);
      }
      return false;
    },

    async get(filePath: string) {
      const res = await fetch(
        this.path(filePath, proxyUrl),
        {
          method: "GET",
          headers: this.headers(),
        },
        FetchType.Sync,
      );

      logger.debug("[WebDav] get", filePath, res.status, res.statusText);

      if (404 == res.status) {
        return "";
      }

      return await res.text();
    },

    async set(filePath: string, value: string) {
      // 确保目录存在
      const dirPath = filePath.split("/").slice(0, -1).join("/");
      if (dirPath) {
        await fetch(
          this.path(dirPath, proxyUrl, "MKCOL"),
          {
            method: "MKCOL",
            headers: this.headers(),
          },
          FetchType.Sync,
        );
      }

      const res = await fetch(
        this.path(filePath, proxyUrl),
        {
          method: "PUT",
          headers: this.headers(),
          body: value,
        },
        FetchType.Sync,
      );

      logger.debug("[WebDav] set", filePath, res.status, res.statusText);
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
