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

/** 将 XML 包装为可在 iframe 中展示的 HTML（树形结构 + 解析失败时回退为源码） */
export function wrapXmlForHtmlPreview(xml: string, frameId: string): string {
  const payload = JSON.stringify(xml.trim());
  const heightScript = `window.addEventListener("DOMContentLoaded",function(){var report=function(){var root=document.getElementById("root");var body=document.body;var h=0;if(root){var rect=root.getBoundingClientRect();var style=getComputedStyle(body);var bottom=parseFloat(style.paddingBottom)||0;h=Math.ceil(rect.bottom+bottom)}else{h=Math.ceil((body&&body.scrollHeight)||0)}parent.postMessage({id:"${frameId}",height:Math.max(h,40)},"*")};if(window.ResizeObserver){new ResizeObserver(report).observe(document.body)}report();setTimeout(report,0)});`;

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>XML 预览</title>
<style>
  *{box-sizing:border-box}
  body{margin:0;padding:12px 16px 20px;font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:13px;line-height:1.5;background:#fff;color:#1f2328}
  .xml-tree{margin:0}
  .node{margin-left:14px;border-left:1px solid #d8dee4;padding-left:8px}
  .xml-tree>.node{margin-left:0;border-left:none;padding-left:0}
  .tag-line{cursor:pointer;user-select:none;padding:2px 0;border-radius:4px}
  .tag-line:hover{background:#f6f8fa}
  .tag-name{color:#116329;font-weight:600}
  .attr-name{color:#0550ae}
  .attr-val{color:#0a3069}
  .text-val{color:#24292f;padding:2px 0 2px 4px}
  .pi,.comment{color:#6e7781;font-style:italic;padding:2px 0}
  .node.collapsed>.children,.node.collapsed>.tag-close{display:none}
  pre.fallback{white-space:pre-wrap;word-break:break-word;margin:0;tab-size:2}
</style>
</head>
<body>
<div id="root"></div>
<script>
${heightScript}
(function(){
  var xml=${payload};
  var root=document.getElementById("root");
  var doc=(new DOMParser()).parseFromString(xml,"application/xml");
  var err=doc.querySelector("parsererror");
  if(err){
    var pre=document.createElement("pre");
    pre.className="fallback";
    pre.textContent=xml;
    root.appendChild(pre);
    return;
  }
  var wrap=document.createElement("div");
  wrap.className="xml-tree";
  for(var i=0;i<doc.childNodes.length;i++){
    var n=renderNode(doc.childNodes[i]);
    if(n) wrap.appendChild(n);
  }
  root.appendChild(wrap);

  function esc(s){return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}
  function renderNode(node){
    if(node.nodeType===3){
      var t=(node.textContent||"").trim();
      if(!t) return null;
      var span=document.createElement("div");
      span.className="text-val";
      span.textContent=t;
      return span;
    }
    if(node.nodeType===8){
      var c=document.createElement("div");
      c.className="comment";
      c.textContent="<!--"+node.textContent+"-->";
      return c;
    }
    if(node.nodeType===7){
      var p=document.createElement("div");
      p.className="pi";
      p.textContent="<?"+node.target+" "+node.data+"?>";
      return p;
    }
    if(node.nodeType!==1) return null;
    var el=node;
    var box=document.createElement("div");
    box.className="node";
    var childEls=[];
    for(var j=0;j<el.childNodes.length;j++){
      var ch=el.childNodes[j];
      if(ch.nodeType===3&&!(ch.textContent||"").trim()) continue;
      var rendered=renderNode(ch);
      if(rendered) childEls.push(rendered);
    }
    var hasChildren=childEls.length>0;
    var open=document.createElement("div");
    open.className="tag-line";
    var html='<span class="tag-name">&lt;'+esc(el.tagName);
    for(var k=0;k<el.attributes.length;k++){
      var a=el.attributes[k];
      html+='</span> <span class="attr-name">'+esc(a.name)+'</span>=<span class="attr-val">&quot;'+esc(a.value)+'&quot;</span><span class="tag-name">';
    }
    html+=hasChildren?'&gt;':' /&gt;';
    html+='</span>';
    open.innerHTML=html;
    box.appendChild(open);
    if(hasChildren){
      open.addEventListener("click",function(e){e.stopPropagation();box.classList.toggle("collapsed")});
      var children=document.createElement("div");
      children.className="children";
      for(var m=0;m<childEls.length;m++) children.appendChild(childEls[m]);
      var close=document.createElement("div");
      close.className="tag-line tag-close";
      close.innerHTML='<span class="tag-name">&lt;/'+esc(el.tagName)+'&gt;</span>';
      box.appendChild(children);
      box.appendChild(close);
    }
    return box;
  }
})();
</script>
</body>
</html>`;
}
