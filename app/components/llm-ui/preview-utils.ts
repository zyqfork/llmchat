import {
  JSON_LIKE_LANGS,
  resolvePreviewTypeFromLang,
} from "./preview-lang-map";
import { detectJsonPreviewType } from "./preview-json-detect";

export type PreviewLanguage =
  | "mermaid"
  | "html"
  | "plantuml"
  | "graphviz"
  | "echarts"
  | "vega"
  | "markmap"
  | "csv";

function normalizeLang(language?: string) {
  return (language || "").trim().toLowerCase();
}

/** HTML：优先看 fence 语言；无标签时仅做前缀判断（非正则） */
function isHtmlWithoutLang(code: string) {
  const trimmed = code.trimStart();
  return (
    trimmed.startsWith("<!DOCTYPE") ||
    trimmed.startsWith("<html") ||
    trimmed.startsWith("<svg") ||
    trimmed.startsWith("<?xml")
  );
}

/**
 * 识别可预览代码块类型。
 *
 * 策略（避免对正文做复杂正则）：
 * 1. Markdown fence 的 language 标签 -> 预览类型（主路径）
 * 2. json/js/ts 等泛型标签 -> 用 JSON 解析 + vega-schema-url-parser / ECharts 结构字段推断
 * 3. 仅 HTML 保留无标签时的前缀兜底
 */
export function getPreviewLanguage(
  code: string,
  language?: string,
): PreviewLanguage | null {
  const lang = normalizeLang(language);

  const fromLang = resolvePreviewTypeFromLang(lang);
  if (fromLang) {
    return fromLang;
  }

  if (JSON_LIKE_LANGS.has(lang)) {
    return detectJsonPreviewType(code);
  }

  if (!lang && isHtmlWithoutLang(code)) {
    return "html";
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
