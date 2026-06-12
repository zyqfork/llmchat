import type { PreviewLanguage } from "./preview-utils";

/** Markdown 代码块 language 别名 -> 预览类型（与 Shiki / 常见 fence 标签对齐） */
export const PREVIEW_LANG_ALIASES: Record<string, PreviewLanguage> = {
  mermaid: "mermaid",
  html: "html",
  htm: "html",
  xml: "html",
  svg: "svg",
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
  json: "json",
  jsonc: "json",
  yaml: "yaml",
  yml: "yaml",
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

/** fence 为 markdown/md 时，可能是 markmap 内容 */
export const MARKDOWN_LIKE_LANGS = new Set(["markdown", "md"]);

export const MERMAID_KEYWORDS = [
  "graph",
  "flowchart",
  "sequenceDiagram",
  "classDiagram",
  "stateDiagram",
  "stateDiagram-v2",
  "erDiagram",
  "journey",
  "gantt",
  "pie",
  "quadrantChart",
  "requirementDiagram",
  "gitGraph",
  "C4Context",
  "mindmap",
  "timeline",
  "zenuml",
  "sankey-beta",
  "block-beta",
  "packet-beta",
  "architecture",
];

export function resolvePreviewTypeFromLang(
  language?: string,
): PreviewLanguage | null {
  const lang = (language || "").trim().toLowerCase();
  if (!lang) return null;
  const alias = PREVIEW_LANG_ALIASES[lang];
  if (alias) return alias;
  if (MERMAID_KEYWORDS.map((k) => k.toLowerCase()).includes(lang)) {
    return "mermaid";
  }
  return null;
}
