import { createHighlighter } from "shiki";
import { loadHighlighter } from "@llm-ui/code";

const COMMON_LANGS = [
  "javascript",
  "typescript",
  "tsx",
  "jsx",
  "python",
  "bash",
  "shell",
  "sh",
  "json",
  "markdown",
  "md",
  "html",
  "css",
  "scss",
  "less",
  "sql",
  "yaml",
  "yml",
  "xml",
  "rust",
  "go",
  "java",
  "kotlin",
  "swift",
  "c",
  "cpp",
  "csharp",
  "php",
  "ruby",
  "lua",
  "docker",
  "dockerfile",
  "toml",
  "ini",
  "graphql",
  "vue",
  "svelte",
  "plaintext",
  "text",
  "tex",
  "latex",
  "powershell",
  "r",
] as const;

const SUPPORTED_LANGS = new Set<string>(COMMON_LANGS);

/** Shiki 未内置的语言映射到可用高亮语言，避免运行时抛错 */
export function resolveShikiLang(language?: string): string {
  const lang = (language || "plaintext").toLowerCase();
  if (SUPPORTED_LANGS.has(lang)) {
    return lang;
  }
  if (lang === "mermaid" || lang === "diagram") {
    return "text";
  }
  return "plaintext";
}

export const llmUiHighlighter = loadHighlighter(
  createHighlighter({
    themes: ["github-light", "github-dark"],
    langs: [...COMMON_LANGS],
  }),
);

export function getShikiTheme() {
  if (typeof document === "undefined") {
    return "github-light";
  }
  const isDark =
    document.body.classList.contains("dark") ||
    (!document.body.classList.contains("light") &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);
  return isDark ? "github-dark" : "github-light";
}
