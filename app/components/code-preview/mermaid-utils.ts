export function isMermaidSource(code: string, language?: string) {
  return (language || "").trim().toLowerCase() === "mermaid";
}
