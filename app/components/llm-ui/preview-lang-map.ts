import type { PreviewLanguage } from "./preview-utils";

/** Markdown 代码块 language 别名 -> 预览类型（与 Shiki / 常见 fence 标签对齐） */
export const PREVIEW_LANG_ALIASES: Record<string, PreviewLanguage> = {
  mermaid: "mermaid",
  html: "html",
  htm: "html",
  xml: "html",
  svg: "html",
  plantuml: "plantuml",
  puml: "plantuml",
  pu: "plantuml",
  dot: "graphviz",
  graphviz: "graphviz",
  gv: "graphviz",
  echarts: "echarts",
  vega: "vega",
  "vega-lite": "vega",
  vegalite: "vega",
  markmap: "markmap",
  mindmap: "markmap",
  csv: "csv",
  tsv: "csv",
};

/** 仅当 fence 为 json / js / ts 等泛型标签时，才尝试用 JSON 结构推断 */
export const JSON_LIKE_LANGS = new Set([
  "json",
  "jsonc",
  "javascript",
  "js",
  "typescript",
  "ts",
]);

export function resolvePreviewTypeFromLang(
  language?: string,
): PreviewLanguage | null {
  const lang = (language || "").trim().toLowerCase();
  if (!lang) return null;
  return PREVIEW_LANG_ALIASES[lang] ?? null;
}
