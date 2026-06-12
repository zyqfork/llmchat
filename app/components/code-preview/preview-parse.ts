/** 去除 JSONC 风格注释后解析 JSON（供 ECharts / Vega / JSON 树预览共用） */
export function parseJsonLike(code: string): unknown {
  const trimmed = code.trim();
  try {
    return JSON.parse(trimmed);
  } catch (firstError) {
    try {
      return JSON.parse(stripJsonComments(trimmed));
    } catch {
      throw firstError;
    }
  }
}

function stripJsonComments(text: string): string {
  let result = "";
  let i = 0;
  let inString = false;
  let escape = false;

  while (i < text.length) {
    const c = text[i];
    if (inString) {
      result += c;
      if (escape) {
        escape = false;
      } else if (c === "\\") {
        escape = true;
      } else if (c === '"') {
        inString = false;
      }
      i++;
      continue;
    }
    if (c === '"') {
      inString = true;
      result += c;
      i++;
      continue;
    }
    if (c === "/" && text[i + 1] === "/") {
      i += 2;
      while (i < text.length && text[i] !== "\n") i++;
      continue;
    }
    if (c === "/" && text[i + 1] === "*") {
      i += 2;
      while (i < text.length && !(text[i] === "*" && text[i + 1] === "/")) {
        i++;
      }
      i += 2;
      continue;
    }
    result += c;
    i++;
  }
  return result;
}
