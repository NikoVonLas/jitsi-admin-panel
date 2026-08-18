// application
export const API_SECRET = Deno.env.get("API_SECRET") || "";
export const API_TIMEOUT = Number(Deno.env.get("API_TIMEOUT") || 86400);

// Optional first-provider bootstrap for Keycloak-only installations.
export const OIDC_PROVIDER_NAME = Deno.env.get("OIDC_PROVIDER_NAME") ||
  "Keycloak";
export const OIDC_ISSUER_URL = Deno.env.get("OIDC_ISSUER_URL") || "";
export const OIDC_CLIENT_ID = Deno.env.get("OIDC_CLIENT_ID") || "";
export const OIDC_CLIENT_SECRET = Deno.env.get("OIDC_CLIENT_SECRET") || "";
export const OIDC_SCOPES = Deno.env.get("OIDC_SCOPES") ||
  "openid profile email";

// Role that grants superadmin privileges (checked in JWT claims)
export const SUPERADMIN_ROLE = Deno.env.get("SUPERADMIN_ROLE") ||
  "jitsi-superadmin";
