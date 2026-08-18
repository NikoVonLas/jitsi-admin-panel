import { parseBoolean } from "./env.ts";

export type RuntimeService = "adm" | "pri" | "pub";

const MIN_API_SECRET_LENGTH = 32;

function requireValue(
  env: Record<string, string>,
  name: string,
  service: RuntimeService,
): string {
  const value = env[name]?.trim();
  if (!value) throw new Error(`${service}: ${name} must be set`);
  return value;
}

function requirePositiveInteger(
  env: Record<string, string>,
  name: string,
  fallback: number,
  service: RuntimeService,
): void {
  const value = Number(env[name] || fallback);
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`${service}: ${name} must be a positive integer`);
  }
}

export function validateRuntimeConfig(
  service: RuntimeService,
  env: Record<string, string> = Deno.env.toObject(),
): void {
  requireValue(env, "DB_PASSWD", service);
  requirePositiveInteger(env, "DB_PORT", 5432, service);
  requirePositiveInteger(env, "DB_POOL_SIZE", 8, service);

  if (service === "pub") return;

  const apiSecret = requireValue(env, "API_SECRET", service);
  if (apiSecret.length < MIN_API_SECRET_LENGTH) {
    throw new Error(
      `${service}: API_SECRET must contain at least ${MIN_API_SECRET_LENGTH} characters`,
    );
  }

  const appFqdn = requireValue(env, "APP_FQDN", service);
  if (appFqdn.includes("://")) {
    throw new Error(`${service}: APP_FQDN must not include a URL scheme`);
  }

  const scheme = (env.APP_SCHEME || "https").trim().toLowerCase();
  if (scheme !== "http" && scheme !== "https") {
    throw new Error(`${service}: APP_SCHEME must be http or https`);
  }
  let publicUrl: URL;
  try {
    publicUrl = new URL(`${scheme}://${appFqdn}`);
  } catch {
    throw new Error(
      `${service}: APP_FQDN must be a hostname with an optional port`,
    );
  }
  if (
    !publicUrl.hostname || publicUrl.username || publicUrl.password ||
    publicUrl.pathname !== "/" || publicUrl.search || publicUrl.hash
  ) {
    throw new Error(
      `${service}: APP_FQDN must be a hostname with an optional port`,
    );
  }

  if (service === "adm") {
    requirePositiveInteger(env, "API_TIMEOUT", 86400, service);
    const cookieFlag = env.SESSION_COOKIE_SECURE?.trim().toLowerCase();
    if (cookieFlag && cookieFlag !== "true" && cookieFlag !== "false") {
      throw new Error("adm: SESSION_COOKIE_SECURE must be true or false");
    }
    const secureCookie = parseBoolean(
      env.SESSION_COOKIE_SECURE,
      scheme === "https",
    );
    if (secureCookie !== (scheme === "https")) {
      throw new Error(
        "adm: SESSION_COOKIE_SECURE must be true for https and false for http",
      );
    }
  }
}
