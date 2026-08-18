// Tests for OIDC admin handlers that work without an external OIDC provider.
// When no provider is configured the handlers return safe empty responses
// (auth_url: "", logout_url: "", or redirect to /login).
import { assertEquals, assertExists, assertMatch } from "@std/assert";
import { afterAll, beforeAll, describe, it } from "@std/testing/bdd";
import { cleanDb, makeRequest } from "../../helpers/db.ts";
import handleOidcAuth from "../../../lib/adm/oidc-auth.ts";
import handleOidcLogout from "../../../lib/adm/oidc-logout.ts";
import handleOidcRedirect from "../../../lib/adm/oidc-redirect.ts";
import handleConfigOidc from "../../../lib/adm/config-oidc.ts";
import handleIdentityOidc from "../../../lib/adm/identity-oidc.ts";
import { adm as wrapperOidc } from "../../../lib/http/wrapper-oidc.ts";
import {
  getAuthEndpoint,
  getLogoutEndpoint,
  getTokenEndpoint,
  getUserinfoEndpoint,
  resolveProvider,
} from "../../../lib/common/oidc.ts";
import { addOidcProvider } from "../../../lib/database/oidc-provider.ts";

const encoder = new TextEncoder();

function base64Url(value: Uint8Array | string): string {
  const bytes = typeof value === "string" ? encoder.encode(value) : value;
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary)
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replace(/=+$/, "");
}

async function signingFixture() {
  const pair = await crypto.subtle.generateKey(
    {
      name: "RSASSA-PKCS1-v1_5",
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: "SHA-256",
    },
    true,
    ["sign", "verify"],
  );
  const jwk = {
    ...await crypto.subtle.exportKey("jwk", pair.publicKey),
    kid: "integration-key",
    alg: "RS256",
    use: "sig",
  };
  return {
    jwk,
    sign: async (payload: Record<string, unknown>) => {
      const header = base64Url(JSON.stringify({
        alg: "RS256",
        kid: "integration-key",
        typ: "JWT",
      }));
      const body = base64Url(JSON.stringify(payload));
      const input = `${header}.${body}`;
      const signature = await crypto.subtle.sign(
        "RSASSA-PKCS1-v1_5",
        pair.privateKey,
        encoder.encode(input),
      );
      return `${input}.${base64Url(new Uint8Array(signature))}`;
    },
  };
}

describe(
  "adm/oidc — no provider configured",
  { sanitizeResources: false, sanitizeOps: false },
  () => {
    beforeAll(async () => {
      await cleanDb();
    });

    afterAll(async () => {
      await cleanDb();
    });

    // -------------------------------------------------------------------------
    it("handleOidcAuth returns empty auth_url when no provider", async () => {
      const req = makeRequest("POST", "/api/adm/auth/oidc", {});
      const res = await handleOidcAuth(req);
      assertEquals(res.status, 200);
      const body = await res.json();
      assertEquals(Array.isArray(body), true);
      assertEquals(body[0].auth_url, "");
    });

    it("handleOidcAuth passes prompt and provider_id", async () => {
      const req = makeRequest("POST", "/api/adm/auth/oidc", {
        prompt: "login",
        provider_id: "00000000-0000-0000-0000-000000000099",
      });
      const res = await handleOidcAuth(req);
      assertEquals(res.status, 200);
      const body = await res.json();
      assertEquals(body[0].auth_url, "");
    });

    // -------------------------------------------------------------------------
    it("handleOidcLogout returns empty logout_url when no provider", async () => {
      const res = await handleOidcLogout(
        makeRequest("POST", "/api/adm/oidc/logout-url", {}),
      );
      assertEquals(res.status, 200);
      const body = await res.json();
      assertEquals(Array.isArray(body), true);
      assertEquals(body[0].logout_url, "");
    });

    // -------------------------------------------------------------------------
    it("handleOidcRedirect redirects to /login when no provider", async () => {
      const req = new Request(
        "http://test/api/adm/auth/oidc/redirect?next=%2Fdashboard",
        { method: "GET" },
      );
      const res = await handleOidcRedirect(req);
      assertEquals(res.status, 302);
      assertEquals(res.headers.get("Location"), "/login");
    });

    // -------------------------------------------------------------------------
    it("handleConfigOidc returns lang", async () => {
      const res = await handleConfigOidc();
      assertEquals(res.status, 200);
      const body = await res.json();
      assertEquals(Array.isArray(body), true);
      assertEquals(typeof body[0].lang, "string");
    });

    // -------------------------------------------------------------------------
    it("wrapper-oidc adm: returns response from handler", async () => {
      const res = await wrapperOidc(
        () =>
          Promise.resolve(
            new Response(JSON.stringify({ ok: true }), { status: 200 }),
          ),
        new Request("http://test/", { method: "GET" }),
      );
      assertEquals(res.status, 200);
    });

    it("wrapper-oidc adm: returns 500 when handler throws", async () => {
      const res = await wrapperOidc(
        () => Promise.reject(new Error("boom")),
        new Request("http://test/", { method: "GET" }),
      );
      assertEquals(res.status, 500);
    });

    // -------------------------------------------------------------------------
    it("resolveProvider returns undefined when no providers exist", async () => {
      const p = await resolveProvider();
      assertEquals(p, undefined);
    });

    it("resolveProvider with explicit id returns undefined for non-existent", async () => {
      const p = await resolveProvider(
        "00000000-0000-0000-0000-000000000099",
      );
      assertEquals(p, undefined);
    });

    it("getAuthEndpoint returns empty string when no provider", async () => {
      assertEquals(await getAuthEndpoint(), "");
    });

    it("getLogoutEndpoint returns empty string when no provider", async () => {
      assertEquals(await getLogoutEndpoint(), "");
    });

    it("getTokenEndpoint returns empty string when no provider", async () => {
      assertEquals(await getTokenEndpoint(), "");
    });

    it("getUserinfoEndpoint returns empty string when no provider", async () => {
      assertEquals(await getUserinfoEndpoint(), "");
    });

    // -------------------------------------------------------------------------
    it("handleIdentityOidc /clear clears cookie and returns 200", async () => {
      const req = makeRequest("POST", "/api/adm/identity/clear", {});
      const res = await handleIdentityOidc(req, "/api/adm/identity/clear");
      assertEquals(res.status, 200);
    });

    it("handleIdentityOidc returns 404 for unknown path", async () => {
      const req = makeRequest("POST", "/api/adm/identity/unknown", {});
      const res = await handleIdentityOidc(req, "/api/adm/identity/unknown");
      assertEquals(res.status, 404);
    });

    it("rejects a code exchange without a signed transaction", async () => {
      const req = makeRequest("POST", "/api/adm/identity/get/bycode", {
        code: "attacker-code",
        state: "attacker-state",
      });
      const res = await handleIdentityOidc(
        req,
        "/api/adm/identity/get/bycode",
      );
      assertEquals(res.status, 401);
    });
  },
);

describe(
  "adm/oidc — signed authorization-code flow",
  { sanitizeResources: false, sanitizeOps: false },
  () => {
    const issuer = "https://idp.integration.example/realms/panel";
    const clientId = "panel-client";
    const originalFetch = globalThis.fetch;

    afterAll(async () => {
      globalThis.fetch = originalFetch;
      await cleanDb();
    });

    it("binds state, PKCE, nonce and provider to the resulting session", async () => {
      await cleanDb();
      const [{ id: providerId }] = await addOidcProvider(
        "Integration IdP",
        issuer,
        clientId,
        "client-secret",
        "openid profile email",
      );
      const { jwk, sign } = await signingFixture();
      let nonce = "";
      let tokenRequestBody = "";

      globalThis.fetch = async (input, init) => {
        const url = String(input);
        if (url === `${issuer}/.well-known/openid-configuration`) {
          return Response.json({
            issuer,
            authorization_endpoint: `${issuer}/authorize`,
            token_endpoint: `${issuer}/token`,
            userinfo_endpoint: `${issuer}/userinfo`,
            jwks_uri: `${issuer}/certs`,
            end_session_endpoint: `${issuer}/logout`,
          });
        }
        if (url === `${issuer}/token`) {
          tokenRequestBody = String(init?.body ?? "");
          const now = Math.floor(Date.now() / 1000);
          return Response.json({
            id_token: await sign({
              iss: issuer,
              sub: "same-subject",
              aud: clientId,
              exp: now + 300,
              iat: now,
              nonce,
            }),
            access_token: await sign({
              iss: issuer,
              exp: now + 300,
              iat: now,
              realm_access: { roles: ["jitsi-superadmin"] },
            }),
          });
        }
        if (url === `${issuer}/certs`) return Response.json({ keys: [jwk] });
        if (url === `${issuer}/userinfo`) {
          return Response.json({
            sub: "same-subject",
            preferred_username: "oidc-admin",
            email: "oidc-admin@example.com",
            email_verified: true,
          });
        }
        throw new Error(`unexpected fetch: ${url}`);
      };

      const authResponse = await handleOidcAuth(
        makeRequest("POST", "/api/adm/oidc/auth-url", {
          provider_id: providerId,
          next: "/meeting?view=list",
          prompt: "login",
        }),
      );
      assertEquals(authResponse.status, 200);
      const [{ auth_url: authUrl }] = await authResponse.json();
      const authorization = new URL(authUrl);
      const state = authorization.searchParams.get("state");
      nonce = authorization.searchParams.get("nonce") ?? "";
      const challenge = authorization.searchParams.get("code_challenge");
      assertExists(state);
      assertMatch(state, /^[A-Za-z0-9_-]{43}$/);
      assertMatch(nonce, /^[A-Za-z0-9_-]{43}$/);
      assertMatch(challenge ?? "", /^[A-Za-z0-9_-]{43}$/);
      assertEquals(
        authorization.searchParams.get("code_challenge_method"),
        "S256",
      );

      const setCookie = authResponse.headers.get("set-cookie");
      assertExists(setCookie);
      const transactionCookie = setCookie.split(";")[0];
      const callback = new Request(
        "https://panel.example/api/adm/identity/get/bycode",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Cookie: transactionCookie,
          },
          body: JSON.stringify({ code: "one-time-code", state }),
        },
      );
      const callbackResponse = await handleIdentityOidc(
        callback,
        "/api/adm/identity/get/bycode",
      );
      assertEquals(callbackResponse.status, 200);
      const [identity] = await callbackResponse.json();
      assertEquals(identity.next, "/meeting?view=list");
      assertEquals(identity.email, "oidc-admin@example.com");
      assertMatch(tokenRequestBody, /code_verifier=[A-Za-z0-9_-]{43}/);
      const sessionCookies = callbackResponse.headers.get("set-cookie") ?? "";
      assertEquals(sessionCookies.includes("token="), true);
      assertEquals(
        sessionCookies.includes(`oidc_provider=${providerId}`),
        true,
      );

      const logoutResponse = await handleOidcLogout(
        makeRequest("POST", "/api/adm/oidc/logout-url", {}, {
          Cookie: `oidc_provider=${providerId}`,
        }),
      );
      const [{ logout_url: logoutUrl }] = await logoutResponse.json();
      assertEquals(
        new URL(logoutUrl).origin,
        "https://idp.integration.example",
      );
      assertEquals(new URL(logoutUrl).searchParams.get("client_id"), clientId);
    });
  },
);
