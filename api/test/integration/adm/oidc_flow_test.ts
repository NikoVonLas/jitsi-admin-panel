// Tests for OIDC admin handlers that work without an external OIDC provider.
// When no provider is configured the handlers return safe empty responses
// (auth_url: "", logout_url: "", or redirect to /login).
import { assertEquals } from "@std/assert";
import { afterAll, beforeAll, describe, it } from "@std/testing/bdd";
import { cleanDb, makeRequest } from "../../helpers/db.ts";
import handleOidcAuth from "../../../lib/adm/oidc-auth.ts";
import handleOidcLogout from "../../../lib/adm/oidc-logout.ts";
import handleOidcRedirect from "../../../lib/adm/oidc-redirect.ts";
import handleConfigOidc from "../../../lib/adm/config-oidc.ts";
import {
  decodeState,
  default as handleIdentityOidc,
} from "../../../lib/adm/identity-oidc.ts";
import { adm as wrapperOidc } from "../../../lib/http/wrapper-oidc.ts";
import {
  getAuthEndpoint,
  getLogoutEndpoint,
  getTokenEndpoint,
  getUserinfoEndpoint,
  resolveProvider,
} from "../../../lib/common/oidc.ts";

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
      const res = await handleOidcLogout();
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

    // -------------------------------------------------------------------------
    it("decodeState returns '/' for null", () => {
      assertEquals(decodeState(null).next, "/");
    });

    it("decodeState parses new JSON format", () => {
      const encoded = encodeURIComponent(
        btoa(JSON.stringify({ next: "/dashboard", pid: "abc" })),
      );
      const result = decodeState(encoded);
      assertEquals(result.next, "/dashboard");
      assertEquals(result.pid, "abc");
    });

    it("decodeState falls back to '/' for invalid state", () => {
      assertEquals(decodeState("garbage!!!").next, "/");
    });

    it("decodeState handles legacy path format", () => {
      const encoded = encodeURIComponent("/some/path");
      const result = decodeState(encoded);
      assertEquals(result.next, "/some/path");
    });

    it("decodeState clips invalid next to '/'", () => {
      const encoded = encodeURIComponent(
        btoa(JSON.stringify({ next: "https://evil.com", pid: "x" })),
      );
      const result = decodeState(encoded);
      assertEquals(result.next, "/");
    });
  },
);
