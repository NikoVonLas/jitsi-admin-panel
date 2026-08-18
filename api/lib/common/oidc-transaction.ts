import { getCookies, setCookie } from "@std/http/cookie";
import { API_SECRET } from "../../config.oidc.ts";
import { SESSION_COOKIE_SECURE } from "../../config.ts";

const encoder = new TextEncoder();
const TRANSACTION_TTL_SECONDS = 10 * 60;
const COOKIE_PREFIX = "oidc_tx_";

interface StoredTransaction {
  state: string;
  providerId: string;
  next: string;
  nonce: string;
  verifier: string;
  expiresAt: number;
}

export interface OidcTransaction extends StoredTransaction {
  codeChallenge: string;
}

function base64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary)
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replace(/=+$/, "");
}

function decodeBase64Url(value: string): Uint8Array<ArrayBuffer> {
  const normalized = value.replaceAll("-", "+").replaceAll("_", "/");
  const padded = normalized.padEnd(
    normalized.length + ((4 - normalized.length % 4) % 4),
    "=",
  );
  const binary = atob(padded);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

function randomBase64Url(length = 32): string {
  return base64Url(crypto.getRandomValues(new Uint8Array(length)));
}

async function hmacKey(): Promise<CryptoKey> {
  return await crypto.subtle.importKey(
    "raw",
    encoder.encode(API_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

async function sign(value: string): Promise<string> {
  const signature = await crypto.subtle.sign(
    "HMAC",
    await hmacKey(),
    encoder.encode(value),
  );
  return base64Url(new Uint8Array(signature));
}

async function verify(value: string, signature: string): Promise<boolean> {
  try {
    return await crypto.subtle.verify(
      "HMAC",
      await hmacKey(),
      decodeBase64Url(signature),
      encoder.encode(value),
    );
  } catch {
    return false;
  }
}

function cookieName(state: string): string {
  return `${COOKIE_PREFIX}${state}`;
}

export function normalizeNextPath(value: unknown): string {
  if (
    typeof value !== "string" || !value.startsWith("/") ||
    value.startsWith("//") || value.includes("\\")
  ) return "/";

  try {
    const origin = new URL("https://panel.invalid");
    const resolved = new URL(value, origin);
    if (resolved.origin !== origin.origin) return "/";
    return `${resolved.pathname}${resolved.search}${resolved.hash}`;
  } catch {
    return "/";
  }
}

export async function createOidcTransaction(
  headers: Headers,
  input: { next: unknown; providerId: string },
  now = Date.now(),
): Promise<OidcTransaction> {
  const state = randomBase64Url();
  const nonce = randomBase64Url();
  const verifier = randomBase64Url();
  const digest = await crypto.subtle.digest(
    "SHA-256",
    encoder.encode(verifier),
  );
  const stored: StoredTransaction = {
    state,
    providerId: input.providerId,
    next: normalizeNextPath(input.next),
    nonce,
    verifier,
    expiresAt: Math.floor(now / 1000) + TRANSACTION_TTL_SECONDS,
  };
  const payload = base64Url(encoder.encode(JSON.stringify(stored)));
  const value = `${payload}.${await sign(payload)}`;

  setCookie(headers, {
    name: cookieName(state),
    value,
    path: "/api/adm/identity/get/bycode",
    maxAge: TRANSACTION_TTL_SECONDS,
    secure: SESSION_COOKIE_SECURE,
    httpOnly: true,
    sameSite: "Lax",
  });

  return { ...stored, codeChallenge: base64Url(new Uint8Array(digest)) };
}

export async function readOidcTransaction(
  req: Request,
  state: string,
  now = Date.now(),
): Promise<StoredTransaction | undefined> {
  if (!state || !/^[A-Za-z0-9_-]{43}$/.test(state)) return undefined;
  const value = getCookies(req.headers)[cookieName(state)];
  if (!value) return undefined;
  const [payload, signature, ...rest] = value.split(".");
  if (!payload || !signature || rest.length > 0) return undefined;
  if (!await verify(payload, signature)) return undefined;

  try {
    const stored = JSON.parse(
      new TextDecoder().decode(decodeBase64Url(payload)),
    ) as StoredTransaction;
    if (
      stored.state !== state || typeof stored.providerId !== "string" ||
      typeof stored.nonce !== "string" || typeof stored.verifier !== "string" ||
      typeof stored.expiresAt !== "number" ||
      stored.expiresAt < Math.floor(now / 1000)
    ) return undefined;
    return { ...stored, next: normalizeNextPath(stored.next) };
  } catch {
    return undefined;
  }
}

export function clearOidcTransaction(headers: Headers, state: string): void {
  if (!/^[A-Za-z0-9_-]{43}$/.test(state)) return;
  setCookie(headers, {
    name: cookieName(state),
    value: "",
    path: "/api/adm/identity/get/bycode",
    maxAge: 0,
    secure: SESSION_COOKIE_SECURE,
    httpOnly: true,
    sameSite: "Lax",
  });
}
