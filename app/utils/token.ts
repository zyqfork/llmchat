/**
 * 估算输入文本的 token 数（启发式近似）。
 *
 * 词边界分组估算：
 * - 英文字母词：length / 3.5 + 0.5
 * - 数字串：0.33/字符
 * - 标点符号：0.2/字符
 * - 中文/日文等：1.7/字符（常见中英混合 tokenizer 约 1.5–1.9，略偏安全）
 */
export function estimateTokenLength(input: string): number {
  const trimmed = input.trim();
  if (trimmed.length === 0) return 0;

  const words = trimmed.split(/\s+/);
  let total = 0;

  for (const word of words) {
    if (word.length === 0) continue;

    let letters = 0, digits = 0, symbols = 0, unicode = 0;

    for (const ch of word) {
      const code = ch.charCodeAt(0);
      if ((code >= 65 && code <= 90) || (code >= 97 && code <= 122)) {
        letters++;
      } else if (code >= 48 && code <= 57) {
        digits++;
      } else if (code >= 128) {
        unicode++;
      } else {
        symbols++;
      }
    }

    if (letters > 0) total += letters / 3.5 + 0.5;
    if (digits > 0) total += digits / 3.0 + 0.25;
    total += unicode * 1.7;
    total += symbols * 0.2;
  }

  return Math.ceil(total);
}