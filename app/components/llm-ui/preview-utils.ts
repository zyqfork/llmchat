import {
  JSON_LIKE_LANGS,
  MARKDOWN_LIKE_LANGS,
  resolvePreviewTypeFromLang,
  MERMAID_KEYWORDS,
} from "./preview-lang-map";
import { detectJsonPreviewType } from "./preview-json-detect";
import { parseJsonLike } from "./preview-parse";

export type PreviewLanguage =
  | "mermaid"
  | "html"
  | "svg"
  | "plantuml"
  | "graphviz"
  | "echarts"
  | "vega"
  | "markmap"
  | "csv"
  | "json"
  | "yaml";

function normalizeLang(language?: string) {
  return (language || "").trim().toLowerCase();
}

/** HTML：优先看 fence 语言；无标签时仅做前缀判断（非正则） */
function isHtmlWithoutLang(code: string) {
  const trimmed = code.trimStart();
  return (
    trimmed.startsWith("<!DOCTYPE") ||
    trimmed.startsWith("<html") ||
    trimmed.startsWith("<?xml")
  );
}

function isSvgWithoutLang(code: string) {
  const trimmed = code.trimStart();
  if (/^<\?xml[\s\S]*?<svg\b/i.test(trimmed)) return true;
  return /^<svg[\s>/]/i.test(trimmed);
}

/** PlantUML：无标签时检查是否以 @startuml 开头 */
function isPlantUmlWithoutLang(code: string) {
  const trimmed = code.trimStart();
  return trimmed.startsWith("@startuml") || trimmed.startsWith("@startmindmap");
}

/** Graphviz DOT：避免把 Mermaid 的 `graph TD` 误判为 Graphviz */
function isGraphvizWithoutLang(code: string) {
  const trimmed = code.trimStart();
  if (trimmed.startsWith("digraph") || trimmed.startsWith("strict digraph")) {
    return true;
  }
  if (trimmed.startsWith("strict graph")) {
    return /^strict graph\s*\{/i.test(trimmed);
  }
  return /^graph\s*\{/i.test(trimmed);
}

/** Mermaid：无标签时检查第一个词是否为 Mermaid 的关键字 */
function isMermaidWithoutLang(code: string): boolean {
  const trimmed = code.trimStart();
  const firstWord = trimmed
    .split(/[\s\r\n(]/, 1)[0]
    .trim()
    .toLowerCase();
  return MERMAID_KEYWORDS.map((k) => k.toLowerCase()).includes(firstWord);
}

/**
 * Markmap：当 fence 为 markdown/md 时，检查内容是否是典型的 markmap 树状结构
 * 特征：以 # 标题开头，包含多级标题（##、###）和列表项
 */
function isMarkmapContent(code: string): boolean {
  const trimmed = code.trimStart();
  if (!trimmed.startsWith("#")) return false;
  const lines = trimmed.split("\n").slice(0, 30);
  let headingCount = 0;
  let listCount = 0;
  for (const line of lines) {
    const t = line.trimStart();
    if (/^#{1,6}\s/.test(t)) headingCount++;
    if (/^[-*+]\s/.test(t)) listCount++;
  }
  // 至少有 2 个标题和一些列表项，才算 markmap 内容
  return headingCount >= 2 && headingCount + listCount >= 4;
}

/**
 * 识别可预览代码块类型。
 *
 * 策略（避免对正文做复杂正则）：
 * 1. Markdown fence 的 language 标签 -> 预览类型（主路径）
 * 2. json/js/ts 等泛型标签 -> 用 JSON 解析 + vega-schema-url-parser / ECharts 结构字段推断
 * 3. markdown/md 标签且内容为树形结构 -> markmap
 * 4. 无标签时的内容检测：HTML、PlantUML、Graphviz
 */
export function getPreviewLanguage(
  code: string,
  language?: string,
): PreviewLanguage | null {
  const lang = normalizeLang(language);

  if (lang === "svg" || (lang === "xml" && isSvgWithoutLang(code))) {
    return "svg";
  }

  const fromLang = resolvePreviewTypeFromLang(lang);
  if (fromLang) {
    return fromLang;
  }

  if (JSON_LIKE_LANGS.has(lang)) {
    const jsonType = detectJsonPreviewType(code);
    if (jsonType) {
      return jsonType;
    }
    if (lang === "json" || lang === "jsonc") {
      return "json";
    }
  }

  // markdown/md 标签时，检查是否是 markmap 内容
  if (MARKDOWN_LIKE_LANGS.has(lang) && isMarkmapContent(code)) {
    return "markmap";
  }

  // 无标签时的内容检测
  if (!lang) {
    if (isSvgWithoutLang(code)) {
      return "svg";
    }
    if (isHtmlWithoutLang(code)) {
      return "html";
    }
    if (isPlantUmlWithoutLang(code)) {
      return "plantuml";
    }
    if (isGraphvizWithoutLang(code)) {
      return "graphviz";
    }
    if (isMermaidWithoutLang(code)) {
      return "mermaid";
    }
    const trimmed = code.trim();
    if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
      try {
        parseJsonLike(trimmed);
        return "json";
      } catch {}
    }
  }

  return null;
}

// 兼容旧引用
export function isHtmlSource(code: string, language?: string) {
  return getPreviewLanguage(code, language) === "html";
}

export function isPlantUmlSource(code: string, language?: string) {
  return getPreviewLanguage(code, language) === "plantuml";
}

export function isGraphvizSource(code: string, language?: string) {
  return getPreviewLanguage(code, language) === "graphviz";
}

export function isEchartsSource(code: string, language?: string) {
  return getPreviewLanguage(code, language) === "echarts";
}

export function isVegaSource(code: string, language?: string) {
  return getPreviewLanguage(code, language) === "vega";
}

export function isMarkmapSource(code: string, language?: string) {
  return getPreviewLanguage(code, language) === "markmap";
}

export function isCsvOrTsvSource(code: string, language?: string) {
  return getPreviewLanguage(code, language) === "csv";
}
