import { encodeBase64 } from "@std/encoding/base64";
import { notFound, ok, unauthorized } from "../http/response.ts";
import { adm as wrapper } from "../http/wrapper-oidc.ts";
import { getOidcDiscovery, resolveProvider } from "../common/oidc.ts";
import { verifyOidcJwt } from "../common/oidc-jwt.ts";
import type { Jwks } from "../common/oidc-jwt.ts";
import { createOidcIdentityId } from "../common/oidc-identity.ts";
import {
  clearOidcTransaction,
  readOidcTransaction,
} from "../common/oidc-transaction.ts";
import {
  clearOidcProviderCookie,
  clearSessionCookie,
  setOidcProviderCookie,
  setSessionCookie,
} from "../common/session-cookie.ts";
import { generateAPIToken } from "../common/token-oidc.ts";
import { addIdentity } from "../database/identity-oidc.ts";
import { setIdentityEmail, setSuperAdmin } from "../database/identity.ts";
import { addProfile } from "../database/profile.ts";
import { APP_FQDN, APP_SCHEME } from "../../config.ts";
import { SUPERADMIN_ROLE } from "../../config.oidc.ts";
import { getSettingValue } from "../database/setting.ts";

const PRE = "/api/adm/identity";

interface TokenSet {
  accessToken: string;
  idToken: string;
}

function unauthorizedWithHeaders(headers: Headers): Response {
  const response = unauthorized();
  const merged = new Headers(response.headers);
  for (const [name, value] of headers) merged.append(name, value);
  return new Response(response.body, {
    status: response.status,
    headers: merged,
  });
}

// -----------------------------------------------------------------------------
// Add the identity if not exists and refresh profile attributes on login.
// -----------------------------------------------------------------------------
async function add(
  userId: string,
  userInfo: Record<string, unknown>,
  accessClaims: Record<string, unknown>,
): Promise<void> {
  const name = typeof userInfo.preferred_username === "string"
    ? userInfo.preferred_username
    : "Guest";
  const email = typeof userInfo.email === "string" ? userInfo.email : "";
  const rows = await addIdentity(userId);

  await setIdentityEmail(userId, email);
  if (rows[0] !== undefined) await addProfile(userId, name, email, true);

  const realmRoles = (accessClaims.realm_access as Record<string, unknown>)
    ?.roles;
  const isSuperAdmin = Array.isArray(realmRoles) &&
    realmRoles.includes(SUPERADMIN_ROLE);
  await setSuperAdmin(userId, isSuperAdmin);
}

// -----------------------------------------------------------------------------
// Exchange the one-time code using the PKCE verifier bound to the transaction.
// -----------------------------------------------------------------------------
async function getToken(
  code: string,
  providerId: string,
  verifier: string,
): Promise<TokenSet | undefined> {
  try {
    const provider = await resolveProvider(providerId);
    const discovery = await getOidcDiscovery(providerId);
    if (!provider || !discovery?.token) {
      throw new Error("invalid OIDC provider");
    }

    const scheme = (await getSettingValue("app_scheme")) || APP_SCHEME;
    const fqdn = (await getSettingValue("app_fqdn")) || APP_FQDN;
    const redirectUri = `${scheme}://${fqdn}/oidc/validate`;
    const headers = new Headers({ Accept: "application/json" });
    const data = new URLSearchParams({
      grant_type: "authorization_code",
      redirect_uri: redirectUri,
      code,
      code_verifier: verifier,
    });

    if (provider.client_secret) {
      headers.set(
        "Authorization",
        `Basic ${
          encodeBase64(`${provider.client_id}:${provider.client_secret}`)
        }`,
      );
    } else {
      data.set("client_id", provider.client_id);
    }

    const res = await fetch(discovery.token, {
      headers,
      method: "POST",
      body: data,
    });
    if (!res.ok) throw new Error(`OIDC token exchange failed: ${res.status}`);
    const json = await res.json();
    if (
      typeof json.access_token !== "string" || typeof json.id_token !== "string"
    ) {
      throw new Error("OIDC token response is incomplete");
    }
    return { accessToken: json.access_token, idToken: json.id_token };
  } catch (e) {
    console.error("getToken failed:", e);
    return undefined;
  }
}

async function getUserInfo(
  token: string,
  endpoint: string,
): Promise<Record<string, unknown> | undefined> {
  try {
    if (!endpoint) throw new Error("missing userinfo endpoint");
    const res = await fetch(endpoint, {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    if (!res.ok) throw new Error(`OIDC userinfo failed: ${res.status}`);
    const userInfo = await res.json();
    if (typeof userInfo.sub !== "string") throw new Error("missing subject");
    if (userInfo.email_verified === false) {
      throw new Error("OIDC email is not verified");
    }
    return userInfo;
  } catch (e) {
    console.error("getUserInfo failed:", e);
    return undefined;
  }
}

async function getJwks(endpoint: string): Promise<Jwks | undefined> {
  try {
    if (!endpoint) throw new Error("missing JWKS endpoint");
    const res = await fetch(endpoint, {
      headers: { Accept: "application/json" },
    });
    if (!res.ok) throw new Error(`OIDC JWKS failed: ${res.status}`);
    const jwks = await res.json();
    if (!Array.isArray(jwks.keys)) throw new Error("invalid JWKS response");
    return jwks as Jwks;
  } catch (e) {
    console.error("getJwks failed:", e);
    return undefined;
  }
}

// -----------------------------------------------------------------------------
// Validate the signed transaction, provider tokens and userinfo subject before
// creating a panel session.
// -----------------------------------------------------------------------------
async function getByCode(req: Request): Promise<Response> {
  const payload = await req.json();
  const code = typeof payload.code === "string" ? payload.code : "";
  const state = typeof payload.state === "string" ? payload.state : "";
  const headers = new Headers();
  if (state) clearOidcTransaction(headers, state);

  const transaction = await readOidcTransaction(req, state);
  if (!code || !transaction) return unauthorizedWithHeaders(headers);

  const provider = await resolveProvider(transaction.providerId);
  const discovery = await getOidcDiscovery(transaction.providerId);
  if (!provider || !discovery) return unauthorizedWithHeaders(headers);

  const tokens = await getToken(
    code,
    transaction.providerId,
    transaction.verifier,
  );
  const jwks = await getJwks(discovery.jwks);
  if (!tokens || !jwks) return unauthorizedWithHeaders(headers);

  try {
    const idClaims = await verifyOidcJwt(tokens.idToken, jwks, {
      issuer: discovery.issuer,
      audience: provider.client_id,
      nonce: transaction.nonce,
    });
    const accessClaims = tokens.accessToken.split(".").length === 3
      ? await verifyOidcJwt(tokens.accessToken, jwks, {
        issuer: discovery.issuer,
      })
      : {};
    const userInfo = await getUserInfo(tokens.accessToken, discovery.userinfo);
    if (!userInfo || userInfo.sub !== idClaims.sub) {
      return unauthorizedWithHeaders(headers);
    }

    const userId = await createOidcIdentityId(
      discovery.issuer,
      String(userInfo.sub),
    );
    await add(userId, userInfo, accessClaims);

    setSessionCookie(headers, await generateAPIToken(userId));
    setOidcProviderCookie(headers, provider.id);
    return ok(
      JSON.stringify([{ ...userInfo, next: transaction.next }]),
      headers,
    );
  } catch (e) {
    console.error("OIDC token validation failed:", e);
    return unauthorizedWithHeaders(headers);
  }
}

// -----------------------------------------------------------------------------
// Clear both the panel session and the selected OIDC provider marker.
// -----------------------------------------------------------------------------
async function clear(req: Request): Promise<Response> {
  await req.json();
  const headers = new Headers();
  clearSessionCookie(headers);
  clearOidcProviderCookie(headers);
  return ok(JSON.stringify([{}]), headers);
}

export default async function handleIdentityOidc(
  req: Request,
  path: string,
): Promise<Response> {
  if (path === `${PRE}/get/bycode`) {
    return await wrapper(getByCode, req);
  } else if (path === `${PRE}/clear`) {
    return await wrapper(clear, req);
  }
  return notFound();
}
