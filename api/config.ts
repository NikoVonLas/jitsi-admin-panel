// server
export const HOSTNAME = "0.0.0.0";
export const PORT_ADMIN = 8000;
export const PORT_PRIVATE = 8001;
export const PORT_PUBLIC = 8002;

// postgres
export const DB_VERSION = "20260618.05";
export const DB_NAME = Deno.env.get("DB_NAME") || "jitsi";
export const DB_USER = Deno.env.get("DB_USER") || "jitsi";
export const DB_PASSWD = Deno.env.get("DB_PASSWD") || "";
export const DB_HOST = Deno.env.get("DB_HOST") || "eb-postgres";
export const DB_PORT = Number(Deno.env.get("DB_PORT") || 5432);
export const DB_POOL_SIZE = Number(Deno.env.get("DB_POOL_SIZE") || 8);
export const DEFAULT_LIST_SIZE = Number(
  Deno.env.get("DEFAULT_LIST_SIZE") || 20,
);
export const MAX_LIST_SIZE = Number(Deno.env.get("MAX_LIST_SIZE") || 2000);

// application
export const APP_FQDN = Deno.env.get("APP_FQDN") || "";
export const APP_SCHEME = Deno.env.get("APP_SCHEME") || "https";
export const ALLOW_UNSECURE_CERT = Boolean(Deno.env.get("ALLOW_UNSECURE_CERT"));

// contact
export const CONTACT_EMAIL = Deno.env.get("CONTACT_EMAIL") || "";

// calendar: first day of week (0 = Sunday, 1 = Monday)
export const WEEK_START = Number(Deno.env.get("WEEK_START") ?? 1);

// UI language: "en" or "ru"
export const LANG = Deno.env.get("LANG_UI") || "en";

// avatar storage directory
export const AVATAR_DIR = Deno.env.get("AVATAR_DIR") || "/data/avatars";
export const FAVICON_DIR = Deno.env.get("FAVICON_DIR") || "/data/favicons";
export const LOGO_DIR = Deno.env.get("LOGO_DIR") || "/data/logo";

// auth: local email/password (true by default; OIDC providers are managed via UI Settings)
export const AUTH_LOCAL = Deno.env.get("AUTH_LOCAL") !== "false";
