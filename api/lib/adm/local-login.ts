import { ok, tooManyRequests, unauthorized } from "../http/response.ts";
import { getIdentityByEmail } from "../database/identity-local.ts";
import { verifyPassword } from "../common/password.ts";
import { generateAPIToken } from "../common/token-oidc.ts";
import {
  clearOidcProviderCookie,
  setSessionCookie,
} from "../common/session-cookie.ts";
import {
  loginRateLimitKey,
  SlidingWindowRateLimiter,
} from "../common/rate-limit.ts";

const loginLimiter = new SlidingWindowRateLimiter(10, 5 * 60 * 1000);

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
    const rateLimitKey = loginRateLimitKey(req, email);
    if (!loginLimiter.take(rateLimitKey)) return tooManyRequests();

    const rows = await getIdentityByEmail(email);
    if (!rows[0]) return unauthorized();

    const { identity_id, password_hash } = rows[0];

    const valid = await verifyPassword(password, password_hash);
    if (!valid) return unauthorized();

    loginLimiter.reset(rateLimitKey);

    const token = await generateAPIToken(identity_id);

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
    console.error("login failed:", e);
    return unauthorized();
  }
}
