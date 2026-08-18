import {
  getEnabledOidcProvider,
  getFirstEnabledOidcProvider,
} from "../database/oidc-provider.ts";
import type { OidcProviderRow } from "../database/oidc-provider.ts";

const CACHE_TTL_MS = 60_000; // refresh discovery every 60s

export interface OidcDiscovery {
  issuer: string;
  auth: string;
  logout: string;
  token: string;
  userinfo: string;
  jwks: string;
}

// Per-issuer endpoint cache
const endpointCache = new Map<
  string,
  { endpoints: OidcDiscovery; expiresAt: number }
>();

// -----------------------------------------------------------------------------
async function getEndpointsForIssuer(
  issuerUrl: string,
): Promise<OidcDiscovery> {
  const now = Date.now();
  const cached = endpointCache.get(issuerUrl);
  if (cached && now < cached.expiresAt) return cached.endpoints;

  try {
    const discoveryUrl = `${
      issuerUrl.replace(/\/$/, "")
    }/.well-known/openid-configuration`;
    const res = await fetch(discoveryUrl);
    if (!res.ok) throw new Error(`OIDC discovery failed: ${res.status}`);
    const cfg = await res.json();

    if (cfg.issuer !== issuerUrl) {
      throw new Error("OIDC discovery issuer mismatch");
    }

    const endpoints: OidcDiscovery = {
      issuer: cfg.issuer ?? "",
      auth: cfg.authorization_endpoint ?? "",
      logout: cfg.end_session_endpoint ?? cfg.logout_endpoint ?? "",
      token: cfg.token_endpoint ?? "",
      userinfo: cfg.userinfo_endpoint ?? "",
      jwks: cfg.jwks_uri ?? "",
    };

    endpointCache.set(issuerUrl, { endpoints, expiresAt: now + CACHE_TTL_MS });
    return endpoints;
  } catch (e) {
    console.error("OIDC discovery error:", e);
    return {
      issuer: "",
      auth: "",
      logout: "",
      token: "",
      userinfo: "",
      jwks: "",
    };
  }
}

// -----------------------------------------------------------------------------
// Resolve provider: by id if given, else first enabled
// -----------------------------------------------------------------------------
export async function resolveProvider(
  providerId?: string,
): Promise<OidcProviderRow | undefined> {
  if (providerId) return await getEnabledOidcProvider(providerId);
  return await getFirstEnabledOidcProvider();
}

export async function getOidcDiscovery(
  providerId: string,
): Promise<OidcDiscovery | undefined> {
  const provider = await resolveProvider(providerId);
  if (!provider?.issuer_url) return undefined;
  const discovery = await getEndpointsForIssuer(provider.issuer_url);
  return discovery.issuer ? discovery : undefined;
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
