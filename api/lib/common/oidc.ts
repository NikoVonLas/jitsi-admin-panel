import {
  getFirstEnabledOidcProvider,
  getOidcProvider,
} from "../database/oidc-provider.ts";
import type { OidcProviderRow } from "../database/oidc-provider.ts";

const CACHE_TTL_MS = 60_000; // refresh discovery every 60s

interface OidcEndpoints {
  auth: string;
  logout: string;
  token: string;
  userinfo: string;
}

// Per-issuer endpoint cache
const endpointCache = new Map<
  string,
  { endpoints: OidcEndpoints; expiresAt: number }
>();

// -----------------------------------------------------------------------------
async function getEndpointsForIssuer(
  issuerUrl: string,
): Promise<OidcEndpoints> {
  const now = Date.now();
  const cached = endpointCache.get(issuerUrl);
  if (cached && now < cached.expiresAt) return cached.endpoints;

  try {
    const discoveryUrl = `${issuerUrl}/.well-known/openid-configuration`;
    const res = await fetch(discoveryUrl);
    if (!res.ok) throw new Error(`OIDC discovery failed: ${res.status}`);
    const cfg = await res.json();

    const endpoints: OidcEndpoints = {
      auth: cfg.authorization_endpoint ?? "",
      logout: cfg.end_session_endpoint ?? cfg.logout_endpoint ?? "",
      token: cfg.token_endpoint ?? "",
      userinfo: cfg.userinfo_endpoint ?? "",
    };

    endpointCache.set(issuerUrl, { endpoints, expiresAt: now + CACHE_TTL_MS });
    return endpoints;
  } catch (e) {
    console.error("OIDC discovery error:", e);
    return { auth: "", logout: "", token: "", userinfo: "" };
  }
}

// -----------------------------------------------------------------------------
// Resolve provider: by id if given, else first enabled
// -----------------------------------------------------------------------------
export async function resolveProvider(
  providerId?: string,
): Promise<OidcProviderRow | undefined> {
  if (providerId) return await getOidcProvider(providerId);
  return await getFirstEnabledOidcProvider();
}

// -----------------------------------------------------------------------------
// Convenience helpers (backward-compat API)
// -----------------------------------------------------------------------------

export async function getAuthEndpoint(providerId?: string): Promise<string> {
  const p = await resolveProvider(providerId);
  if (!p?.issuer_url) return "";
  const eps = await getEndpointsForIssuer(p.issuer_url);
  return eps.auth;
}

export async function getLogoutEndpoint(providerId?: string): Promise<string> {
  const p = await resolveProvider(providerId);
  if (!p?.issuer_url) return "";
  const eps = await getEndpointsForIssuer(p.issuer_url);
  return eps.logout;
}

export async function getTokenEndpoint(providerId?: string): Promise<string> {
  const p = await resolveProvider(providerId);
  if (!p?.issuer_url) return "";
  const eps = await getEndpointsForIssuer(p.issuer_url);
  return eps.token;
}

export async function getUserinfoEndpoint(
  providerId?: string,
): Promise<string> {
  const p = await resolveProvider(providerId);
  if (!p?.issuer_url) return "";
  const eps = await getEndpointsForIssuer(p.issuer_url);
  return eps.userinfo;
}
