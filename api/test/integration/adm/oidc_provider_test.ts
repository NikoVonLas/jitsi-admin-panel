import { assertEquals } from "@std/assert";
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  it,
} from "@std/testing/bdd";
import { cleanDb, makeRequest } from "../../helpers/db.ts";
import { registerFirst } from "../../helpers/auth.ts";
import routeOidcProvider from "../../../lib/adm/oidc-provider.ts";

const EMAIL = "admin@oidctest.example";
const PASSWORD = "secure_oidc_test_pass_123";

describe(
  "OIDC provider CRUD",
  { sanitizeResources: false, sanitizeOps: false },
  () => {
    beforeAll(async () => {
      await cleanDb();
      await registerFirst(EMAIL, PASSWORD);
    });

    afterAll(async () => {
      await cleanDb();
    });

    beforeEach(async () => {
      const { query } = await import("../../../lib/database/common.ts");
      await query({ text: "DELETE FROM oidc_provider" });
    });

    it("adds a new OIDC provider", async () => {
      const req = makeRequest("POST", "/api/adm/oidc-provider/add", {
        name: "Test SSO",
        issuer_url: "https://sso.example.com",
        client_id: "client_test",
        client_secret: "secret123",
        scopes: "openid profile email",
      });
      const res = await routeOidcProvider(req, "/api/adm/oidc-provider/add");
      assertEquals(res.status, 200);
      const body = await res.json();
      assertEquals(body.ok, true);
    });

    it("returns 400 when required fields missing", async () => {
      const req = makeRequest("POST", "/api/adm/oidc-provider/add", {
        name: "Incomplete",
        issuer_url: "https://sso.example.com",
        // client_id and client_secret missing
      });
      const res = await routeOidcProvider(req, "/api/adm/oidc-provider/add");
      assertEquals(res.status, 400);
    });

    it("lists OIDC providers via GET", async () => {
      // Add one first
      const addReq = makeRequest("POST", "/api/adm/oidc-provider/add", {
        name: "My SSO",
        issuer_url: "https://issuer.example.com",
        client_id: "client_1",
        client_secret: "secret_1",
        scopes: "openid",
      });
      await routeOidcProvider(addReq, "/api/adm/oidc-provider/add");

      const listReq = new Request(
        "http://test/api/adm/oidc-provider/list",
        { method: "GET" },
      );
      const res = await routeOidcProvider(
        listReq,
        "/api/adm/oidc-provider/list",
      );
      assertEquals(res.status, 200);
      const body = await res.json();
      assertEquals(Array.isArray(body), true);
      assertEquals(body.length, 1);
      assertEquals(body[0].name, "My SSO");
      // client_secret must be stripped
      assertEquals(body[0].client_secret, undefined);
    });

    it("enables a provider", async () => {
      const addReq = makeRequest("POST", "/api/adm/oidc-provider/add", {
        name: "Enable SSO",
        issuer_url: "https://enable.example.com",
        client_id: "cid",
        client_secret: "csec",
      });
      await routeOidcProvider(addReq, "/api/adm/oidc-provider/add");

      const listReq = new Request(
        "http://test/api/adm/oidc-provider/list",
        { method: "GET" },
      );
      const listRes = await routeOidcProvider(
        listReq,
        "/api/adm/oidc-provider/list",
      );
      const providers = await listRes.json();
      const id = providers[0].id;

      const enableReq = makeRequest("POST", "/api/adm/oidc-provider/enable", {
        id,
      });
      const res = await routeOidcProvider(
        enableReq,
        "/api/adm/oidc-provider/enable",
      );
      assertEquals(res.status, 200);
    });

    it("disables a provider", async () => {
      const addReq = makeRequest("POST", "/api/adm/oidc-provider/add", {
        name: "Disable SSO",
        issuer_url: "https://disable.example.com",
        client_id: "cid2",
        client_secret: "csec2",
      });
      await routeOidcProvider(addReq, "/api/adm/oidc-provider/add");

      const listReq = new Request(
        "http://test/api/adm/oidc-provider/list",
        { method: "GET" },
      );
      const listRes = await routeOidcProvider(
        listReq,
        "/api/adm/oidc-provider/list",
      );
      const providers = await listRes.json();
      const id = providers[0].id;

      const disableReq = makeRequest(
        "POST",
        "/api/adm/oidc-provider/disable",
        { id },
      );
      const res = await routeOidcProvider(
        disableReq,
        "/api/adm/oidc-provider/disable",
      );
      assertEquals(res.status, 200);
    });

    it("deletes a provider", async () => {
      const addReq = makeRequest("POST", "/api/adm/oidc-provider/add", {
        name: "Delete SSO",
        issuer_url: "https://delete.example.com",
        client_id: "cid3",
        client_secret: "csec3",
      });
      await routeOidcProvider(addReq, "/api/adm/oidc-provider/add");

      const listReq = new Request(
        "http://test/api/adm/oidc-provider/list",
        { method: "GET" },
      );
      const listRes = await routeOidcProvider(
        listReq,
        "/api/adm/oidc-provider/list",
      );
      const providers = await listRes.json();
      const id = providers[0].id;

      const delReq = makeRequest("POST", "/api/adm/oidc-provider/del", { id });
      const res = await routeOidcProvider(
        delReq,
        "/api/adm/oidc-provider/del",
      );
      assertEquals(res.status, 200);
    });

    it("returns 404 for unknown path", async () => {
      const req = makeRequest("POST", "/api/adm/oidc-provider/unknown", {});
      const res = await routeOidcProvider(
        req,
        "/api/adm/oidc-provider/unknown",
      );
      assertEquals(res.status, 404);
    });

    it("returns 400 for enable without id", async () => {
      const req = makeRequest("POST", "/api/adm/oidc-provider/enable", {});
      const res = await routeOidcProvider(
        req,
        "/api/adm/oidc-provider/enable",
      );
      assertEquals(res.status, 400);
    });
  },
);
