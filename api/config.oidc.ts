// application
export const API_SECRET = Deno.env.get("API_SECRET") || "mysecret";
export const API_TIMEOUT = Number(Deno.env.get("API_TIMEOUT") || 86400);

// Role that grants superadmin privileges (checked in JWT claims)
export const SUPERADMIN_ROLE = Deno.env.get("SUPERADMIN_ROLE") ||
  "jitsi-superadmin";
