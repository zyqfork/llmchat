/**
 * 对称加密工具 - 使用 AES-GCM 算法
 * 支持空密码（使用默认密钥）和自定义密码
 */

// 默认密钥（当密码为空时使用）
const DEFAULT_KEY = "chatgpt-next-web-sync-default-key";

/**
 * 从密码派生加密密钥
 */
async function deriveKey(password: string): Promise<CryptoKey> {
  const keyMaterial = password || DEFAULT_KEY;
  const encoder = new TextEncoder();
  const keyData = encoder.encode(keyMaterial);

  // 使用 PBKDF2 派生密钥
  const baseKey = await crypto.subtle.importKey(
    "raw",
    keyData,
    "PBKDF2",
    false,
    ["deriveKey"],
  );

  // 使用固定的 salt（因为我们需要在不同设备上解密）
  const salt = encoder.encode("chatgpt-next-web-salt");

  return await crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt,
      iterations: 100000,
      hash: "SHA-256",
    },
    baseKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

/**
 * 加密数据
 * @param plaintext 明文数据
 * @param password 加密密码（空字符串使用默认密钥）
 * @returns Base64 编码的密文（包含 IV）
 */
export async function encrypt(
  plaintext: string,
  password: string = "",
): Promise<string> {
  const key = await deriveKey(password);
  const encoder = new TextEncoder();
  const data = encoder.encode(plaintext);

  // 生成随机 IV
  const iv = crypto.getRandomValues(new Uint8Array(12));

  // 加密
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    data,
  );

  // 将 IV 和密文组合
  const combined = new Uint8Array(iv.length + encrypted.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(encrypted), iv.length);

  // 转换为 Base64（分块处理避免栈溢出）
  const chunkSize = 8192;
  let binaryString = "";
  for (let i = 0; i < combined.length; i += chunkSize) {
    const chunk = combined.subarray(
      i,
      Math.min(i + chunkSize, combined.length),
    );
    binaryString += String.fromCharCode.apply(null, Array.from(chunk));
  }
  return btoa(binaryString);
}

/**
 * 解密数据
 * @param ciphertext Base64 编码的密文
 * @param password 解密密码（空字符串使用默认密钥）
 * @returns 解密后的明文
 */
export async function decrypt(
  ciphertext: string,
  password: string = "",
): Promise<string> {
  const key = await deriveKey(password);

  // 从 Base64 解码
  const combined = Uint8Array.from(atob(ciphertext), (c) => c.charCodeAt(0));

  // 分离 IV 和密文
  const iv = combined.slice(0, 12);
  const encrypted = combined.slice(12);

  // 解密
  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    encrypted,
  );

  const decoder = new TextDecoder();
  return decoder.decode(decrypted);
}

/**
 * 检查数据是否已加密（简单检测）
 */
export function isEncrypted(data: string): boolean {
  // 加密数据是 Base64 格式，且解码后至少有 12 字节的 IV
  try {
    const decoded = atob(data);
    return decoded.length > 12 && !/^[\{\[]/.test(data);
  } catch {
    return false;
  }
}
