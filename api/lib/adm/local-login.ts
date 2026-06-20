import { setCookie } from "@std/http/cookie";
import { ok, unauthorized } from "../http/response.ts";
import { getIdentityByEmail } from "../database/identity-local.ts";
import { verifyPassword } from "../common/password.ts";
import { generateAPIToken } from "../common/token-oidc.ts";
import { ALLOW_UNSECURE_CERT } from "../../config.ts";

// POST /api/adm/auth/local/login
// body: { email, password }
// → verifies password hash → generates API JWT → returns { token }
export default async function handleLocalLogin(
  req: Request,
): Promise<Response> {
  try {
    const body = await req.json();
    const email: string = (body.email ?? "").trim().toLowerCase();
    const password: string = body.password ?? "";

    if (!email || !password) return unauthorized();

    const rows = await getIdentityByEmail(email);
    if (!rows[0]) return unauthorized();

    const { identity_id, password_hash } = rows[0];

    const valid = await verifyPassword(password, password_hash);
    if (!valid) return unauthorized();

    const token = await generateAPIToken(identity_id);

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
