import { getCookies, setCookie } from "@std/http/cookie";
import { SESSION_COOKIE_SECURE } from "../../config.ts";

const SESSION_COOKIE = "token";
const OIDC_PROVIDER_COOKIE = "oidc_provider";

function setHttpOnlyCookie(
  headers: Headers,
  name: string,
  value: string,
  maxAge?: number,
): void {
  setCookie(headers, {
    name,
    value,
    path: "/api",
    maxAge,
    secure: SESSION_COOKIE_SECURE,
    httpOnly: true,
    sameSite: "Lax",
  });
}

export function setSessionCookie(headers: Headers, token: string): void {
  setHttpOnlyCookie(headers, SESSION_COOKIE, token);
}

export function clearSessionCookie(headers: Headers): void {
  setHttpOnlyCookie(headers, SESSION_COOKIE, "", 0);
}

export function setOidcProviderCookie(
  headers: Headers,
  providerId: string,
): void {
  setHttpOnlyCookie(headers, OIDC_PROVIDER_COOKIE, providerId);
}

export function clearOidcProviderCookie(headers: Headers): void {
  setHttpOnlyCookie(headers, OIDC_PROVIDER_COOKIE, "", 0);
}

export function getOidcProviderCookie(req: Request): string | undefined {
  const providerId = getCookies(req.headers)[OIDC_PROVIDER_COOKIE];
  return providerId && /^[0-9a-f-]{36}$/i.test(providerId)
    ? providerId
    : undefined;
}
