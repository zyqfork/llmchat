import { isXmlPreviewContent, wrapXmlForHtmlPreview } from "./preview-xml";

function heightReportScript(frameId: string) {
  return `window.addEventListener("DOMContentLoaded",function(){var report=function(){var body=document.body;var h=0;if(body){var style=getComputedStyle(body);var bottom=parseFloat(style.paddingBottom)||0;var max=0;for(var i=0;i<body.children.length;i++){var rect=body.children[i].getBoundingClientRect();max=Math.max(max,rect.bottom)}h=Math.ceil(max+bottom);if(!h){h=body.scrollHeight||0}}parent.postMessage({id:"${frameId}",height:Math.max(h,40)},"*")};if(window.ResizeObserver){new ResizeObserver(report).observe(document.body)}report();setTimeout(report,0)});`;
}

/** SVG：独立标签或带 XML 声明的 SVG 文档 */
export function isSvgPreviewContent(code: string, language?: string): boolean {
  const lang = (language || "").trim().toLowerCase();
  if (lang === "svg") return true;
  if (lang === "xml") return false;

  const trimmed = code.trimStart();
  if (/^<\?xml[\s\S]*?<svg\b/i.test(trimmed)) return true;
  return /^<svg[\s>/]/i.test(trimmed);
}

export function wrapSvgForHtmlPreview(svg: string, frameId: string): string {
  const content = svg.trim();
  const script = heightReportScript(frameId);
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
  *{box-sizing:border-box}
  html,body{margin:0;padding:12px;background:#fff}
  body{display:flex;justify-content:center;align-items:flex-start;min-height:40px}
  svg{max-width:100%;height:auto;display:block}
</style>
</head>
<body>${content}</body>
<script>${script}</script>
</html>`;
}

/** HTML 片段（无 DOCTYPE / 无 html 根）需包一层文档，否则 iframe 易空白 */
export function wrapHtmlFragmentForPreview(
  fragment: string,
  frameId: string,
): string {
  const script = heightReportScript(frameId);
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
  html,body{margin:0;padding:0;background:#fff;color:#1f2328}
  body{overflow:auto}
</style>
</head>
<body>${fragment}</body>
<script>${script}</script>
</html>`;
}

function isFullHtmlDocument(code: string) {
  const trimmed = code.trimStart();
  return /^<!DOCTYPE\s+html/i.test(trimmed) || /^<html[\s>/]/i.test(trimmed);
}

function injectHeightScriptIntoHtml(html: string, frameId: string): string {
  const script = `<script>${heightReportScript(frameId)}</script>`;
  if (/^<!DOCTYPE\s+html/i.test(html.trimStart())) {
    return html.replace(/<!DOCTYPE\s+html>/i, (m) => m + script);
  }
  if (/<\/body>/i.test(html)) {
    return html.replace(/<\/body>/i, `${script}</body>`);
  }
  return html + script;
}

/** 生成 iframe srcDoc（统一处理 XML / SVG / HTML 完整文档 / HTML 片段） */
export function buildIframeSrcDoc(
  code: string,
  frameId: string,
  language?: string,
): string {
  if (isXmlPreviewContent(code, language)) {
    return wrapXmlForHtmlPreview(code, frameId);
  }
  if (isSvgPreviewContent(code, language)) {
    return wrapSvgForHtmlPreview(code, frameId);
  }
  if (isFullHtmlDocument(code)) {
    return injectHeightScriptIntoHtml(code, frameId);
  }
  return wrapHtmlFragmentForPreview(code, frameId);
}
