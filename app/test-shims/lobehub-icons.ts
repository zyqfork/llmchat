// @lobehub/icons 的 Jest mock：替换真实 ESM 包，避免 jsdom 兼容问题
// 仅导出测试所需的组件名，渲染一个占位 <svg> 元素
function EmptySvg() {
  return { type: "svg", props: { children: null } };
}

function makeIcon() {
  const icon = EmptySvg as any;
  icon.Avatar = EmptySvg;
  icon.Color = EmptySvg;
  icon.Combine = EmptySvg;
  icon.Mono = EmptySvg;
  icon.Text = EmptySvg;
  icon.BrandColor = EmptySvg;
  icon.Morden = EmptySvg;
  return icon;
}

export const Azure = makeIcon();
export const Claude = makeIcon();
export const DeepSeek = makeIcon();
export const Gemini = makeIcon();
export const Gemma = makeIcon();
export const Grok = makeIcon();
export const Kimi = makeIcon();
export const LobeHub = makeIcon();
export const Meta = makeIcon();
export const Mistral = makeIcon();
export const Moonshot = makeIcon();
export const Ollama = makeIcon();
export const OpenAI = makeIcon();
export const Qwen = makeIcon();
export const SiliconCloud = makeIcon();
export const Wenxin = makeIcon();