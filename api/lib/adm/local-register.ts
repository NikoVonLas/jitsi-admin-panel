import { setCookie } from "@std/http/cookie";
import { conflict, ok, unauthorized } from "../http/response.ts";
import {
  createLocalIdentity,
  getIdentityByEmail,
  hasAnyLocalUser,
} from "../database/identity-local.ts";
import { hashPassword } from "../common/password.ts";
import { generateAPIToken } from "../common/token-oidc.ts";
import { addProfile } from "../database/profile.ts";
import { setIdentityEmail, setSuperAdmin } from "../database/identity.ts";
import { ALLOW_UNSECURE_CERT, AUTH_LOCAL } from "../../config.ts";

// POST /api/adm/auth/local/register
// body: { email, password, name? }
// → creates identity + identity_local → returns { token }
export default async function handleLocalRegister(
  req: Request,
): Promise<Response> {
  try {
    // Setup mode only — once a user exists, register is closed
    if (!AUTH_LOCAL || await hasAnyLocalUser()) return unauthorized();

    const body = await req.json();
    const email: string = (body.email ?? "").trim().toLowerCase();
    const password: string = body.password ?? "";
    const name: string = (body.name ?? "").trim() || email.split("@")[0];

    if (!email || !password || password.length < 14) return unauthorized();

    // Check email is not already taken
    const existing = await getIdentityByEmail(email);
    if (existing[0]) return conflict();

    const passwordHash = await hashPassword(password);
    const rows = await createLocalIdentity(email, passwordHash);
    if (!rows[0]) return unauthorized();

    const identityId = rows[0].id;

    // First registered user is always superadmin
    await setSuperAdmin(identityId, true);
    // Set the email in identity_attr and create a default profile
    await setIdentityEmail(identityId, email);
    await addProfile(identityId, name, email, true);

    const token = await generateAPIToken(identityId);

    // Set httpOnly cookie so the private API can authenticate the request
    const headers = new Headers();
    setCookie(headers, {
      name: "token",
      value: token,
      path: "/api",
      secure: !ALLOW_UNSECURE_CERT,
      httpOnly: true,
      sameSite: "Lax",
    });

    headers.set("Content-Type", "application/json");

    return ok(JSON.stringify({ token }), headers);
  } catch {
    return unauthorized();
  }
}
