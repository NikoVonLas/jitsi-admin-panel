const PUBLIC_POST_PATHS = new Set([
  "/api/adm/identity/clear",
  "/api/adm/identity/get/bycode",
  "/api/adm/oidc/auth-url",
  "/api/adm/oidc/logout-url",
]);

export function isPublicAuthPostPath(path: string): boolean {
  return PUBLIC_POST_PATHS.has(path);
}
