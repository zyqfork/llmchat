import { STORAGE_KEY } from "@/app/constant";
import { SyncStore } from "@/app/store/sync";
import { chunks } from "../format";
import { fetch, getProxyUrl, FetchType } from "@/app/utils/fetch";

export type UpstashConfig = SyncStore["upstash"];
export type UpStashClient = ReturnType<typeof createUpstashClient>;

export function createUpstashClient(store: SyncStore) {
  const config = store.upstash;
  const proxyUrl = getProxyUrl(store.useProxy, store.proxyUrl);

  // 将文件路径转换为 Redis key: llmchat/chat.json -> llmchat-chat-json
  const pathToKey = (filePath: string) => {
    return filePath.replace(/[\/\.]/g, "-");
  };

  return {
    async check() {
      try {
        const testKey = config.username || STORAGE_KEY;
        const res = await fetch(
          this.path(`get/${testKey}`, proxyUrl),
          {
            method: "GET",
            headers: this.headers(),
          },
          FetchType.Sync,
        );
        console.log("[Upstash] check", res.status, res.statusText);
        return [200].includes(res.status);
      } catch (e) {
        console.error("[Upstash] failed to check", e);
      }
      return false;
    },

    async redisGet(key: string) {
      const res = await fetch(
        this.path(`get/${key}`, proxyUrl),
        {
          method: "GET",
          headers: this.headers(),
        },
        FetchType.Sync,
      );

      const resJson = (await res.json()) as { result: string };
      return resJson.result;
    },

    async redisSet(key: string, value: string) {
      const res = await fetch(
        this.path(`set/${key}`, proxyUrl),
        {
          method: "POST",
          headers: this.headers(),
          body: value,
        },
        FetchType.Sync,
      );
      console.log("[Upstash] set key", key, res.status, res.statusText);
    },

    async get(filePath: string) {
      const redisKey = pathToKey(filePath);
      const chunkCountKey = `${redisKey}-chunk-count`;
      const chunkIndexKey = (i: number) => `${redisKey}-chunk-${i}`;

      const chunkCount = Number(await this.redisGet(chunkCountKey));
      if (!Number.isInteger(chunkCount)) return "";

      const chunkList = await Promise.all(
        new Array(chunkCount)
          .fill(0)
          .map((_, i) => this.redisGet(chunkIndexKey(i))),
      );
      console.log("[Upstash] get", filePath, "chunks:", chunkCount);
      return chunkList.join("");
    },

    async set(filePath: string, value: string) {
      const redisKey = pathToKey(filePath);
      const chunkCountKey = `${redisKey}-chunk-count`;
      const chunkIndexKey = (i: number) => `${redisKey}-chunk-${i}`;

      let index = 0;
      for await (const chunk of chunks(value)) {
        await this.redisSet(chunkIndexKey(index), chunk);
        index += 1;
      }
      await this.redisSet(chunkCountKey, index.toString());
      console.log("[Upstash] set", filePath, "chunks:", index);
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

      if (!proxyUrl) {
        let endpoint = config.endpoint;
        if (!endpoint.endsWith("/")) {
          endpoint += "/";
        }
        return endpoint + path;
      }

      if (proxyUrl.length > 0 && !proxyUrl.endsWith("/")) {
        proxyUrl += "/";
      }

      let url;
      const pathPrefix = "/api/upstash/";

      try {
        let u = new URL(proxyUrl + pathPrefix + path);
        u.searchParams.append("endpoint", config.endpoint);
        url = u.toString();
      } catch (e) {
        url = pathPrefix + path + "?endpoint=" + config.endpoint;
      }

      return url;
    },
  };
}
