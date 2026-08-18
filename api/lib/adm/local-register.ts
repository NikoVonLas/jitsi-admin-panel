import { conflict, ok, unauthorized } from "../http/response.ts";
import {
  createFirstLocalIdentity,
  getIdentityByEmail,
  hasAnyLocalUser,
} from "../database/identity-local.ts";
import { hashPassword } from "../common/password.ts";
import { generateAPIToken } from "../common/token-oidc.ts";
import { addProfile } from "../database/profile.ts";
import { setIdentityEmail, setSuperAdmin } from "../database/identity.ts";
import { AUTH_LOCAL } from "../../config.ts";
import {
  clearOidcProviderCookie,
  setSessionCookie,
} from "../common/session-cookie.ts";

// POST /api/adm/auth/local/register
// body: { email, password, name? }
// → creates identity + identity_local → returns { token }
export default async function handleLocalRegister(
  req: Request,
): Promise<Response> {
  try {
    // Setup mode only — once a user exists, register is closed
    if (!AUTH_LOCAL) return unauthorized();
    if (await hasAnyLocalUser()) return conflict();

    const body = await req.json();
    const email: string = (body.email ?? "").trim().toLowerCase();
    const password: string = body.password ?? "";
    const name: string = (body.name ?? "").trim() || email.split("@")[0];

    if (!email || !password || password.length < 14) return unauthorized();

    // Check email is not already taken
    const existing = await getIdentityByEmail(email);
    if (existing[0]) return conflict();

    const passwordHash = await hashPassword(password);
    const rows = await createFirstLocalIdentity(email, passwordHash);
    if (!rows[0]) return conflict();

    const identityId = rows[0].id;

    // First registered user is always superadmin
    await setSuperAdmin(identityId, true);
    // Set the email in identity_attr and create a default profile
    await setIdentityEmail(identityId, email);
    await addProfile(identityId, name, email, true);

    const token = await generateAPIToken(identityId);

    // Set httpOnly cookie so the private API can authenticate the request
    const headers = new Headers();
    setSessionCookie(headers, token);
    clearOidcProviderCookie(headers);

    headers.set("Content-Type", "application/json");

    return ok(
      JSON.stringify({ authenticated: true, method: "local" }),
      headers,
    );
  } catch (e) {
    console.error("register failed:", e);
    return unauthorized();
  }
}
