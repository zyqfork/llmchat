const MERMAID_START =
  /^(graph\s|flowchart\s|sequenceDiagram|classDiagram|stateDiagram-v2|stateDiagram|erDiagram|gantt|pie\s|journey|gitGraph|C4Context|mindmap|timeline|quadrantChart|sankey-beta|xychart-beta|block-beta)/;

export function isMermaidSource(code: string, language?: string) {
  if (language === "mermaid") return true;
  return MERMAID_START.test(code.trimStart());
}
