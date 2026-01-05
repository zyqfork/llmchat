import { SyncStore } from "@/app/store/sync";
import { fetch as tauriFetch, FetchType } from "@/app/utils/fetch";

export type S3Config = SyncStore["s3"];
export type S3Client = ReturnType<typeof createS3Client>;

async function signRequest(
  method: string,
  url: URL,
  headers: Record<string, string>,
  body: string,
  config: S3Config,
): Promise<Record<string, string>> {
  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, "");
  const dateStamp = amzDate.slice(0, 8);

  const service = "s3";
  const region = config.region || "us-east-1";

  const payloadHash = await sha256(body);

  const signedHeaders: Record<string, string> = {
    ...headers,
    host: url.host,
    "x-amz-date": amzDate,
    "x-amz-content-sha256": payloadHash,
  };

  const sortedHeaderKeys = Object.keys(signedHeaders).sort();
  const canonicalHeaders = sortedHeaderKeys
    .map((k) => `${k.toLowerCase()}:${signedHeaders[k].trim()}`)
    .join("\n");
  const signedHeadersStr = sortedHeaderKeys
    .map((k) => k.toLowerCase())
    .join(";");

  const canonicalRequest = [
    method,
    url.pathname,
    url.search.slice(1),
    canonicalHeaders + "\n",
    signedHeadersStr,
    payloadHash,
  ].join("\n");

  const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
  const stringToSign = [
    "AWS4-HMAC-SHA256",
    amzDate,
    credentialScope,
    await sha256(canonicalRequest),
  ].join("\n");

  const signingKey = await getSignatureKey(
    config.secretKey,
    dateStamp,
    region,
    service,
  );
  const signature = await hmacSha256Hex(signingKey, stringToSign);

  const authorization = `AWS4-HMAC-SHA256 Credential=${config.accessKey}/${credentialScope}, SignedHeaders=${signedHeadersStr}, Signature=${signature}`;

  return {
    ...signedHeaders,
    Authorization: authorization,
  };
}

async function sha256(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function hmacSha256(
  key: ArrayBuffer,
  message: string,
): Promise<ArrayBuffer> {
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    key,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return await crypto.subtle.sign(
    "HMAC",
    cryptoKey,
    new TextEncoder().encode(message),
  );
}

async function hmacSha256Hex(
  key: ArrayBuffer,
  message: string,
): Promise<string> {
  const result = await hmacSha256(key, message);
  return Array.from(new Uint8Array(result))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function getSignatureKey(
  secretKey: string,
  dateStamp: string,
  region: string,
  service: string,
): Promise<ArrayBuffer> {
  const kDate = await hmacSha256(
    new TextEncoder().encode("AWS4" + secretKey).buffer as ArrayBuffer,
    dateStamp,
  );
  const kRegion = await hmacSha256(kDate, region);
  const kService = await hmacSha256(kRegion, service);
  return await hmacSha256(kService, "aws4_request");
}

export function createS3Client(store: SyncStore) {
  const config = store.s3;

  const getUrl = (filePath: string) => {
    return new URL(
      `${config.endpoint}/${config.bucket}/${filePath}`.replace(
        /([^:]\/)\/+/g,
        "$1",
      ),
    );
  };

  return {
    async check() {
      try {
        const testPath = `${config.username}/test.json`;
        const url = getUrl(testPath);

        const headers = await signRequest(
          "HEAD",
          url,
          { "content-type": "application/json" },
          "",
          config,
        );

        const res = await tauriFetch(
          url.toString(),
          {
            method: "HEAD",
            headers,
          },
          FetchType.Sync,
        );

        console.log("[S3] check", res.status, res.statusText);
        return [200, 404, 403].includes(res.status);
      } catch (e) {
        console.error("[S3] failed to check", e);
      }
      return false;
    },

    async get(filePath: string) {
      const url = getUrl(filePath);

      const headers = await signRequest(
        "GET",
        url,
        { "content-type": "application/json" },
        "",
        config,
      );

      const res = await tauriFetch(
        url.toString(),
        {
          method: "GET",
          headers,
        },
        FetchType.Sync,
      );

      console.log("[S3] get", filePath, res.status, res.statusText);

      if (res.status === 404) {
        return "";
      }

      return await res.text();
    },

    async set(filePath: string, value: string) {
      const url = getUrl(filePath);

      const headers = await signRequest(
        "PUT",
        url,
        { "content-type": "application/json" },
        value,
        config,
      );

      const res = await tauriFetch(
        url.toString(),
        {
          method: "PUT",
          headers,
          body: value,
        },
        FetchType.Sync,
      );

      console.log("[S3] set", filePath, res.status, res.statusText);
    },
  };
}
