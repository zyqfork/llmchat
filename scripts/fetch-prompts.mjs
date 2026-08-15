import fs from "fs/promises";

const RAW_FILE_URL = "https://raw.githubusercontent.com/";

const RAW_CN_URL = "PlexPt/awesome-chatgpt-prompts-zh/main/prompts-zh.json";
const CN_URL = RAW_FILE_URL + RAW_CN_URL;
const RAW_TW_URL = "PlexPt/awesome-chatgpt-prompts-zh/main/prompts-zh-TW.json";
const TW_URL = RAW_FILE_URL + RAW_TW_URL;
const RAW_EN_URL = "f/awesome-chatgpt-prompts/main/prompts.csv";
const EN_URL = RAW_FILE_URL + RAW_EN_URL;
const FILE = "./public/prompts.json";

const ignoreWords = ["涩涩", "魅魔", "澀澀"];

const TIMEOUT_MS = 15_000;

async function fetchCN() {
  console.log("[Fetch] fetching cn prompts...");
  try {
    const response = await fetch(CN_URL, { signal: AbortSignal.timeout(TIMEOUT_MS) });
    const raw = await response.json();
    return raw
      .map((v) => [v.act, v.prompt])
      .filter(
        (v) =>
          v[0] &&
          v[1] &&
          ignoreWords.every((w) => !v[0].includes(w) && !v[1].includes(w)),
      );
  } catch (error) {
    console.error("[Fetch] failed to fetch cn prompts", error);
    return [];
  }
}

async function fetchTW() {
  console.log("[Fetch] fetching tw prompts...");
  try {
    const response = await fetch(TW_URL, { signal: AbortSignal.timeout(TIMEOUT_MS) });
    const raw = await response.json();
    return raw
      .map((v) => [v.act, v.prompt])
      .filter(
        (v) =>
          v[0] &&
          v[1] &&
          ignoreWords.every((w) => !v[0].includes(w) && !v[1].includes(w)),
      );
  } catch (error) {
    console.error("[Fetch] failed to fetch tw prompts", error);
    return [];
  }
}

async function fetchEN() {
  console.log("[Fetch] fetching en prompts...");
  try {
    const response = await fetch(EN_URL, { signal: AbortSignal.timeout(TIMEOUT_MS) });
    const raw = await response.text();
    return raw
      .split("\n")
      .slice(1)
      .map((v) =>
        v
          .split('","')
          .map((v) => v.replace(/^"|"$/g, "").replaceAll('""', '"'))
          .filter((v) => v[0] && v[1]),
      );
  } catch (error) {
    console.error("[Fetch] failed to fetch en prompts", error);
    return [];
  }
}

async function main() {
  const [cn, tw, en] = await Promise.all([fetchCN(), fetchTW(), fetchEN()]);
  try {
    await fs.writeFile(FILE, JSON.stringify({ cn, tw, en }));
    console.log("[Fetch] saved to " + FILE);
  } catch (error) {
    console.error("[Fetch] failed to write prompts file", error);
    process.exitCode = 1;
  }
}

await main();
