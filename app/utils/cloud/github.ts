import { SyncStore } from "@/app/store/sync";
import { fetch as tauriFetch, FetchType } from "@/app/utils/fetch";
import { logger } from "@/app/utils/logger";

export type GitHubConfig = SyncStore["github"];
export type GitHubClient = ReturnType<typeof createGitHubClient>;

interface GitHubFileResponse {
  sha: string;
  content: string;
  encoding: string;
}

interface GitHubErrorResponse {
  message: string;
  documentation_url?: string;
}

export function createGitHubClient(store: SyncStore) {
  const config = store.github;

  const parseRepo = () => {
    const parts = config.repo.split("/");
    if (parts.length !== 2) {
      throw new Error("Invalid repo format. Expected: owner/repo");
    }
    return { owner: parts[0], repo: parts[1] };
  };

  // 获取完整文件路径: {configPath}/{filePath}
  const getFullPath = (filePath: string) => {
    return config.path ? `${config.path}/${filePath}` : filePath;
  };

  const apiBase = "https://api.github.com";

  return {
    async check() {
      try {
        const { owner, repo } = parseRepo();
        const res = await tauriFetch(
          `${apiBase}/repos/${owner}/${repo}`,
          { method: "GET", headers: this.headers() },
          FetchType.Sync,
        );

        logger.debug("[GitHub] check repo", res.status, res.statusText);
        return res.status === 200;
      } catch (e) {
        logger.error("[GitHub] failed to check", e);
      }
      return false;
    },

    async get(filePath: string) {
      try {
        const { owner, repo } = parseRepo();
        const branch = config.branch || "main";
        const fullPath = getFullPath(filePath);

        const res = await tauriFetch(
          `${apiBase}/repos/${owner}/${repo}/contents/${fullPath}?ref=${branch}`,
          { method: "GET", headers: this.headers() },
          FetchType.Sync,
        );

        logger.debug("[GitHub] get", filePath, res.status, res.statusText);

        if (res.status === 404) {
          return "";
        }

        if (!res.ok) {
          return "";
        }

        const data = (await res.json()) as GitHubFileResponse;

        // GitHub API 返回 base64 编码的内容，需要正确处理 UTF-8
        if (data.content && data.encoding === "base64") {
          const binaryString = atob(data.content.replace(/\n/g, ""));
          // 将二进制字符串转换为 Uint8Array，然后用 TextDecoder 解码 UTF-8
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          const decoded = new TextDecoder("utf-8").decode(bytes);
          return decoded;
        }

        return "";
      } catch (e) {
        logger.error("[GitHub] failed to get", e);
        return "";
      }
    },

    async set(filePath: string, value: string) {
      const { owner, repo } = parseRepo();
      const branch = config.branch || "main";
      const fullPath = getFullPath(filePath);

      // 获取现有文件的 SHA
      let sha: string | undefined;
      const existingRes = await tauriFetch(
        `${apiBase}/repos/${owner}/${repo}/contents/${fullPath}?ref=${branch}`,
        { method: "GET", headers: this.headers() },
        FetchType.Sync,
      );

      if (existingRes.status === 200) {
        const existingData = (await existingRes.json()) as GitHubFileResponse;
        sha = existingData.sha;
      }

      const body: Record<string, string> = {
        message: `Sync ${filePath} - ${new Date().toISOString()}`,
        content: btoa(
          encodeURIComponent(value).replace(/%([0-9A-F]{2})/g, (_, p1) =>
            String.fromCharCode(parseInt(p1, 16)),
          ),
        ),
        branch,
      };

      if (sha) {
        body.sha = sha;
      }

      const res = await tauriFetch(
        `${apiBase}/repos/${owner}/${repo}/contents/${fullPath}`,
        {
          method: "PUT",
          headers: this.headers(),
          body: JSON.stringify(body),
        },
        FetchType.Sync,
      );

      logger.debug("[GitHub] set", filePath, res.status, res.statusText);

      if (!res.ok) {
        const error = (await res.json()) as GitHubErrorResponse;
        throw new Error(`GitHub API error: ${error.message}`);
      }
    },

    headers() {
      return {
        Authorization: `Bearer ${config.token}`,
        Accept: "application/vnd.github.v3+json",
        "Content-Type": "application/json",
        "X-GitHub-Api-Version": "2022-11-28",
      };
    },
  };
}
