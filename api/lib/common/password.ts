// hashPassword(password: string): Promise<string>  — returns "salt:hash" base64
// verifyPassword(password: string, stored: string): Promise<boolean>

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await deriveKey(password, salt);
  const hash = await crypto.subtle.exportKey("raw", key);
  const saltB64 = btoa(String.fromCodePoint(...salt));
  const hashB64 = btoa(String.fromCodePoint(...new Uint8Array(hash)));
  return `${saltB64}:${hashB64}`;
}

export async function verifyPassword(
  password: string,
  stored: string,
): Promise<boolean> {
  const [saltB64, hashB64] = stored.split(":");
  const salt = Uint8Array.from(atob(saltB64), (c) => c.codePointAt(0) ?? 0);
  const key = await deriveKey(password, salt);
  const hash = await crypto.subtle.exportKey("raw", key);
  const newHashB64 = btoa(String.fromCodePoint(...new Uint8Array(hash)));
  return newHashB64 === hashB64;
}

async function deriveKey(
  password: string,
  salt: Uint8Array<ArrayBuffer>,
): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const baseKey = await crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    "PBKDF2",
    false,
    ["deriveKey"],
  );
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations: 100000, hash: "SHA-256" },
    baseKey,
    { name: "HMAC", hash: "SHA-256", length: 256 },
    true,
    ["sign"],
  );
}
