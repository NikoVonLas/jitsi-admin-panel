import handleLocalRegister from "../../lib/adm/local-register.ts";
import handleLocalLogin from "../../lib/adm/local-login.ts";
import { makeRequest } from "./db.ts";

export interface AuthResult {
  token: string;
  identityId: string;
}

// Decode the JWT payload (base64url) to extract userId
function decodeJwt(token: string): Record<string, unknown> {
  const [, payloadB64] = token.split(".");
  const padded = payloadB64.replace(/-/g, "+").replace(/_/g, "/") +
    "=".repeat((4 - (payloadB64.length % 4)) % 4);
  return JSON.parse(atob(padded));
}

// Register a new user and return their token + identityId.
// Assumes cleanDb() has been called so no users exist yet.
export async function registerFirst(
  email: string,
  password: string,
  name?: string,
): Promise<AuthResult> {
  const req = makeRequest("POST", "/api/adm/auth/local/register", {
    email,
    password,
    name: name ?? email.split("@")[0],
  });
  const res = await handleLocalRegister(req);
  if (res.status !== 200) {
    throw new Error(`Register failed: ${res.status}`);
  }
  const body = await res.json();
  const token = body.token as string;
  const payload = decodeJwt(token);
  const identityId = payload.userId as string;
  return { token, identityId };
}

// Login and return token + identityId
export async function login(
  email: string,
  password: string,
): Promise<AuthResult> {
  const req = makeRequest("POST", "/api/adm/auth/local/login", {
    email,
    password,
  });
  const res = await handleLocalLogin(req);
  if (res.status !== 200) {
    throw new Error(`Login failed: ${res.status}`);
  }
  const body = await res.json();
  const token = body.token as string;
  const payload = decodeJwt(token);
  const identityId = payload.userId as string;
  return { token, identityId };
}
