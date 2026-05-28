import { isMermaidSource } from "./mermaid-utils";

export function isHtmlSource(code: string, language?: string) {
  return (
    language === "html" ||
    code.startsWith("<!DOCTYPE") ||
    code.startsWith("<svg") ||
    code.startsWith("<?xml")
  );
}

export function getPreviewLanguage(
  code: string,
  language?: string,
): "mermaid" | "html" | null {
  if (isMermaidSource(code, language)) {
    return "mermaid";
  }
  if (isHtmlSource(code, language)) {
    return "html";
  }
  return null;
}
