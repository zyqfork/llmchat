import { createWebDavClient } from "./webdav";
import { createUpstashClient } from "./upstash";
import { createGitHubClient } from "./github";
import { createS3Client } from "./s3";

export enum ProviderType {
  WebDAV = "webdav",
  UpStash = "upstash",
  GitHub = "github",
  S3 = "s3",
}

export const SyncClients = {
  [ProviderType.UpStash]: createUpstashClient,
  [ProviderType.WebDAV]: createWebDavClient,
  [ProviderType.GitHub]: createGitHubClient,
  [ProviderType.S3]: createS3Client,
} as const;

type SyncClientConfig = {
  [K in keyof typeof SyncClients]: (typeof SyncClients)[K] extends (
    _: infer C,
  ) => any
    ? C
    : never;
};

export type SyncClient = {
  get: (key: string) => Promise<string>;
  set: (key: string, value: string) => Promise<void>;
  check: () => Promise<boolean>;
};

export function createSyncClient<T extends ProviderType>(
  provider: T,
  config: SyncClientConfig[T],
): SyncClient {
  return SyncClients[provider](config as any) as any;
}
