import { STORAGE_KEY } from "@/app/constant";
import { SyncStore } from "@/app/store/sync";
import { chunks } from "../format";
import { getProxyUrl, isTauriApp, tauriFetch } from "@/app/utils/tauri-proxy";

export type UpstashConfig = SyncStore["upstash"];
export type UpStashClient = ReturnType<typeof createUpstashClient>;

export function createUpstashClient(store: SyncStore) {
  const config = store.upstash;
  const storeKey = config.username.length === 0 ? STORAGE_KEY : config.username;
  const chunkCountKey = `${storeKey}-chunk-count`;
  const chunkIndexKey = (i: number) => `${storeKey}-chunk-${i}`;

  // 使用统一的 getProxyUrl 函数
  // 在 Tauri 环境中会返回空字符串（使用 proxy_fetch 命令）
  const proxyUrl = getProxyUrl(store.useProxy, store.proxyUrl);

  // 在 Tauri 环境中使用 tauriFetch，否则使用普通 fetch
  const useTauriFetch = isTauriApp() && store.useProxy;
  const fetchFn = useTauriFetch ? tauriFetch : fetch;

  if (useTauriFetch) {
    console.log("[Upstash] Using Tauri fetch (proxy_fetch command)");
  } else if (store.useProxy) {
    console.log("[Upstash] Using proxy URL:", proxyUrl);
  } else {
    console.log("[Upstash] Direct connection (no proxy)");
  }

  return {
    async check() {
      try {
        const res = await fetchFn(this.path(`get/${storeKey}`, proxyUrl), {
          method: "GET",
          headers: this.headers(),
        });
        console.log("[Upstash] check", res.status, res.statusText);
        return [200].includes(res.status);
      } catch (e) {
        console.error("[Upstash] failed to check", e);
      }
      return false;
    },

    async redisGet(key: string) {
      const res = await fetchFn(this.path(`get/${key}`, proxyUrl), {
        method: "GET",
        headers: this.headers(),
      });

      console.log("[Upstash] get key = ", key, res.status, res.statusText);
      const resJson = (await res.json()) as { result: string };

      return resJson.result;
    },

    async redisSet(key: string, value: string) {
      const res = await fetchFn(this.path(`set/${key}`, proxyUrl), {
        method: "POST",
        headers: this.headers(),
        body: value,
      });

      console.log("[Upstash] set key = ", key, res.status, res.statusText);
    },

    async get() {
      const chunkCount = Number(await this.redisGet(chunkCountKey));
      if (!Number.isInteger(chunkCount)) return;

      const chunks = await Promise.all(
        new Array(chunkCount)
          .fill(0)
          .map((_, i) => this.redisGet(chunkIndexKey(i))),
      );
      console.log("[Upstash] get full chunks", chunks);
      return chunks.join("");
    },

    async set(_: string, value: string) {
      // upstash limit the max request size which is 1Mb for “Free” and “Pay as you go”
      // so we need to split the data to chunks
      let index = 0;
      for await (const chunk of chunks(value)) {
        await this.redisSet(chunkIndexKey(index), chunk);
        index += 1;
      }
      await this.redisSet(chunkCountKey, index.toString());
    },

    headers() {
      return {
        Authorization: `Bearer ${config.apiKey}`,
      };
    },
    path(path: string, proxyUrl: string = "") {
      if (!path.endsWith("/")) {
        path += "/";
      }
      if (path.startsWith("/")) {
        path = path.slice(1);
      }

      // 如果没有启用代理或代理 URL 为空，直接使用 Upstash 端点
      if (!proxyUrl) {
        let endpoint = config.endpoint;
        if (!endpoint.endsWith("/")) {
          endpoint += "/";
        }
        return endpoint + path;
      }

      // 在 standalone 模式中，使用代理服务器
      if (proxyUrl.length > 0 && !proxyUrl.endsWith("/")) {
        proxyUrl += "/";
      }

      let url;
      const pathPrefix = "/api/upstash/";

      try {
        let u = new URL(proxyUrl + pathPrefix + path);
        // add query params
        u.searchParams.append("endpoint", config.endpoint);
        url = u.toString();
      } catch (e) {
        url = pathPrefix + path + "?endpoint=" + config.endpoint;
      }

      return url;
    },
  };
}
