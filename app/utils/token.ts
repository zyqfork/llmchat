/**
 * 估算输入文本的 token 数（启发式近似）。
 *
 * 采用词边界分组估算，比之前逐字符累加更接近真实 tokenizer 行为：
 * - 英文字母词：length / 3.5 + 0.5（约每 3.5 个字母 1 token，含起止）
 * - 数字串：0.33/字符
 * - 标点符号：0.2/字符
 * - 中文/日文等 Unicode 字符：2.0/字符（中文约 1.8–2.2 per token）
 */
export function estimateTokenLength(input: string): number {
  const trimmed = input.trim();
  if (trimmed.length === 0) return 0;

  // 按空白拆分连续字符块
  const words = trimmed.split(/\s+/);
  let total = 0;

  for (const word of words) {
    if (word.length === 0) continue;

    let letters = 0, digits = 0, symbols = 0, unicode = 0;

    for (const ch of word) {
      const code = ch.charCodeAt(0);
      if ((code >= 65 && code <= 90) || (code >= 97 && code <= 122)) {
        // A-Z / a-z
        letters++;
      } else if (code >= 48 && code <= 57) {
        digits++;
      } else if (code >= 128) {
        // 中文/日文等
        unicode++;
      } else {
        // 其他 ASCII 标点
        symbols++;
      }
    }

    if (letters > 0) total += letters / 3.5 + 0.5;       // ~3.5 字母 = 1 token + 起止权
    if (digits > 0) total += digits / 3.0 + 0.25;        // ~3 数字 = 1 token
    total += unicode * 2.0;                               // 中文等，每字符 2 tokens
    total += symbols * 0.2;                               // 标点符号
  }

  return Math.ceil(total);
}