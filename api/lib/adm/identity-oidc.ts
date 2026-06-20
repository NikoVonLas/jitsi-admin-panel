import { v5 as uuid } from "@std/uuid";
import { setCookie } from "@std/http/cookie";
import { encodeBase64 } from "@std/encoding/base64";
import { notFound, ok, unauthorized } from "../http/response.ts";
import { adm as wrapper } from "../http/wrapper-oidc.ts";
import {
  getTokenEndpoint,
  getUserinfoEndpoint,
  resolveProvider,
} from "../common/oidc.ts";
import { generateAPIToken } from "../common/token-oidc.ts";
import { addIdentity } from "../database/identity-oidc.ts";
import { setIdentityEmail, setSuperAdmin } from "../database/identity.ts";
import { addProfile } from "../database/profile.ts";
import { ALLOW_UNSECURE_CERT, APP_FQDN, APP_SCHEME } from "../../config.ts";
import { SUPERADMIN_ROLE } from "../../config.oidc.ts";
import { getSettingValue } from "../database/setting.ts";

const PRE = "/api/adm/identity";
const UUID_NAMESPACE = "6ba7b810-9dad-11d1-80b4-00c04fd430c8";

// -----------------------------------------------------------------------------
// Decode a JWT payload without signature verification.
// Safe here because the token was obtained directly from the OIDC provider's
// token endpoint — we trust the source, not the signature.
// -----------------------------------------------------------------------------
function decodeJwtPayload(token: string): Record<string, unknown> {
  try {
    const b64 = token.split(".")[1].replaceAll("-", "+").replaceAll("_", "/");
    return JSON.parse(atob(b64));
  } catch {
    return {};
  }
}

// -----------------------------------------------------------------------------
// Decode state parameter: supports both new JSON format and legacy path string
// Returns { next: string, pid: string | undefined }
// -----------------------------------------------------------------------------
function decodeState(state: string | null): { next: string; pid?: string } {
  if (!state) return { next: "/" };
  try {
    const decoded = decodeURIComponent(state);
    // New format: base64-encoded JSON {"next": "/...", "pid": "uuid"}
    const json = JSON.parse(atob(decoded));
    if (typeof json === "object" && json !== null) {
      const next = typeof json.next === "string" && json.next.startsWith("/")
        ? json.next
        : "/";
      const pid = typeof json.pid === "string" ? json.pid : undefined;
      return { next, pid };
    }
  } catch {
    // Legacy format: just an encoded path
  }
  try {
    const decoded = decodeURIComponent(state);
    if (decoded.startsWith("/")) return { next: decoded };
  } catch {
    // ignore
  }
  return { next: "/" };
}

// -----------------------------------------------------------------------------
// Add the identity if not exists.
// Update the identity's email after each login.
// -----------------------------------------------------------------------------
async function add(
  userId: string,
  userInfo: Record<string, unknown>,
  accessToken: string,
): Promise<void> {
  const name = (typeof userInfo.preferred_username === "string")
    ? userInfo.preferred_username
    : "Guest";
  const email = (typeof userInfo.email === "string") ? userInfo.email : "";
  const rows = await addIdentity(userId);

  await setIdentityEmail(userId, email);

  if (rows[0] !== undefined) {
    await addProfile(userId, name, email, true);
  }

  // realm_access.roles lives in the access token JWT, not in the userinfo
  // endpoint response — decode the token to get the actual realm roles.
  const jwt = decodeJwtPayload(accessToken);
  const realmRoles = (jwt.realm_access as Record<string, unknown>)?.roles;
  const isSuperAdmin = Array.isArray(realmRoles) &&
    realmRoles.includes(SUPERADMIN_ROLE);
  await setSuperAdmin(userId, isSuperAdmin);
}

// -----------------------------------------------------------------------------
// Get the access token from the OIDC provider by using the short-term auth code
// -----------------------------------------------------------------------------
async function getToken(
  code: string,
  providerId?: string,
): Promise<string | undefined> {
  try {
    const provider = await resolveProvider(providerId);
    if (!provider) throw new Error("no OIDC provider configured");

    const tokenEndpoint = await getTokenEndpoint(provider.id);
    if (!tokenEndpoint) throw new Error("missing token endpoint");

    const scheme = (await getSettingValue("app_scheme")) || APP_SCHEME;
    const fqdn = (await getSettingValue("app_fqdn")) || APP_FQDN;
    const redirectURI = `${scheme}://${fqdn}/oidc/validate`;

    const headers = new Headers();
    headers.append("Accept", "application/json");

    const data = new URLSearchParams();
    data.append("grant_type", "authorization_code");
    data.append("redirect_uri", redirectURI);
    data.append("code", code);

    if (provider.client_secret) {
      headers.append(
        "Authorization",
        "Basic " +
          encodeBase64(
            `${provider.client_id}:${provider.client_secret}`,
          ),
      );
    } else {
      data.append("client_id", provider.client_id);
    }

    const res = await fetch(tokenEndpoint, {
      headers: headers,
      method: "POST",
      body: data,
    });
    const json = await res.json();
    const token = json.access_token;

    if (!token) throw new Error("cannot get the OIDC token");

    return token;
  } catch (e) {
    console.error("getToken failed:", e);
    return undefined;
  }
}

// -----------------------------------------------------------------------------
// Get the user info from the OIDC provider by using the access token
// -----------------------------------------------------------------------------
async function getUserInfo(
  token: string,
  providerId?: string,
): Promise<Record<string, unknown> | undefined> {
  try {
    const userinfoEndpoint = await getUserinfoEndpoint(providerId);
    if (!userinfoEndpoint) throw new Error("missing userinfo endpoint");

    const res = await fetch(userinfoEndpoint, {
      headers: {
        "Accept": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      method: "GET",
    });
    const userInfo = await res.json();

    if (!userInfo.sub) throw new Error("no user info");

    return userInfo;
  } catch {
    return undefined;
  }
}

// -----------------------------------------------------------------------------
// Return the user identity and a token for API calls if auth code is valid
// -----------------------------------------------------------------------------
async function getByCode(req: Request): Promise<Response> {
  const pl = await req.json();
  const code: string = pl.code;
  // provider_id may be passed from the frontend (decoded from state)
  const providerId: string | undefined = pl.provider_id ?? undefined;

  // Get the access token from the OIDC provider
  const token = await getToken(code, providerId);
  if (!token) return unauthorized();

  // Get the user info from the OIDC provider
  const userInfo = await getUserInfo(token, providerId);
  if (!userInfo) return unauthorized();
  if (typeof userInfo.sub !== "string") return unauthorized();

  // Create uuid as userId based on sub
  const sub = new TextEncoder().encode(userInfo.sub);
  const userId = await uuid.generate(UUID_NAMESPACE, sub);

  // Add the identity if not exists in the database
  await add(userId, userInfo, token);

  // The client waits for a list of identities but it will use only the first
  // identity from this list. So, put the only available identity into the list.
  const identities = [userInfo];

  // Send token inside the cookie.
  const headers = new Headers();
  setCookie(headers, {
    name: "token",
    value: await generateAPIToken(userId),
    path: "/api",
    secure: !ALLOW_UNSECURE_CERT,
    httpOnly: true,
    sameSite: "Lax",
  });

  return ok(JSON.stringify(identities), headers);
}

// -----------------------------------------------------------------------------
// Reset the token in cookies to clear the identity on the client-side
// -----------------------------------------------------------------------------
async function clear(req: Request): Promise<Response> {
  const _pl = await req.json();

  const headers = new Headers();
  setCookie(headers, {
    name: "token",
    value: "",
    path: "/api",
    secure: !ALLOW_UNSECURE_CERT,
    httpOnly: true,
    sameSite: "Lax",
  });

  return ok(JSON.stringify([{}]), headers);
}

// -----------------------------------------------------------------------------
export { decodeState };

export default async function handleIdentityOidc(
  req: Request,
  path: string,
): Promise<Response> {
  if (path === `${PRE}/get/bycode`) {
    return await wrapper(getByCode, req);
  } else if (path === `${PRE}/clear`) {
    return await wrapper(clear, req);
  } else {
    return notFound();
  }
}
