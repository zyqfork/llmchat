/** 是否应按 XML 文档预览（而非原始 HTML / SVG 渲染） */
export function isXmlPreviewContent(code: string, language?: string): boolean {
  const lang = (language || "").trim().toLowerCase();
  if (lang === "svg") return false;

  const trimmed = code.trimStart();
  if (trimmed.startsWith("<?xml") && /<svg\b/i.test(trimmed)) {
    return false;
  }
  if (lang === "xml") {
    return !/^<svg[\s>/]/i.test(trimmed);
  }
  return trimmed.startsWith("<?xml");
}
