// Integration tests for pri/oidc-provider routes.
// These mirror the adm OIDC provider tests but through the pri handler.
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
import routeOidcProvider from "../../../lib/pri/oidc-provider.ts";

const EMAIL = "admin@pri-oidcprov-test.example";
const PASSWORD = "secure_pri_oidc_pass_1234!";

describe(
  "pri/oidc-provider CRUD",
  { sanitizeResources: false, sanitizeOps: false },
  () => {
    let identityId = "";

    beforeAll(async () => {
      await cleanDb();
      const auth = await registerFirst(EMAIL, PASSWORD);
      identityId = auth.identityId;
    });

    afterAll(async () => {
      await cleanDb();
    });

    beforeEach(async () => {
      const { query } = await import("../../../lib/database/common.ts");
      await query({ text: "DELETE FROM oidc_provider" });
    });

    it("lists providers (empty initially)", async () => {
      const req = makeRequest(
        "POST",
        "/api/pri/oidc-provider/list",
        {},
      );
      const res = await routeOidcProvider(
        req,
        "/api/pri/oidc-provider/list",
        identityId,
      );
      assertEquals(res.status, 200);
      const body = await res.json();
      assertEquals(Array.isArray(body), true);
      assertEquals(body.length, 0);
    });

    it("adds a new provider", async () => {
      const req = makeRequest("POST", "/api/pri/oidc-provider/add", {
        name: "My SSO",
        issuer_url: "https://sso.example.com",
        client_id: "my-client",
        client_secret: "my-secret",
        scopes: "openid profile email",
      });
      const res = await routeOidcProvider(
        req,
        "/api/pri/oidc-provider/add",
        identityId,
      );
      assertEquals(res.status, 200);
    });

    it("add returns 500 when required fields missing", async () => {
      // issuer_url is required; missing it should throw
      const req = makeRequest("POST", "/api/pri/oidc-provider/add", {
        name: "Bad",
      });
      const res = await routeOidcProvider(
        req,
        "/api/pri/oidc-provider/add",
        identityId,
      );
      assertEquals(res.status, 500);
    });

    it("updates a provider", async () => {
      // Add first
      const addReq = makeRequest("POST", "/api/pri/oidc-provider/add", {
        name: "Update SSO",
        issuer_url: "https://update.example.com",
        client_id: "cid-u",
        client_secret: "sec-u",
      });
      await routeOidcProvider(
        addReq,
        "/api/pri/oidc-provider/add",
        identityId,
      );

      const listReq = makeRequest(
        "POST",
        "/api/pri/oidc-provider/list",
        {},
      );
      const listRes = await routeOidcProvider(
        listReq,
        "/api/pri/oidc-provider/list",
        identityId,
      );
      const providers = await listRes.json();
      const id = providers[0].id;

      const updateReq = makeRequest("POST", "/api/pri/oidc-provider/update", {
        id,
        name: "Updated SSO",
        issuer_url: "https://update.example.com",
        client_id: "cid-u2",
        client_secret: "",
        scopes: "openid",
      });
      const updateRes = await routeOidcProvider(
        updateReq,
        "/api/pri/oidc-provider/update",
        identityId,
      );
      assertEquals(updateRes.status, 200);
    });

    it("update returns 500 when id missing", async () => {
      const req = makeRequest("POST", "/api/pri/oidc-provider/update", {
        name: "No Id",
        issuer_url: "https://example.com",
        client_id: "x",
      });
      const res = await routeOidcProvider(
        req,
        "/api/pri/oidc-provider/update",
        identityId,
      );
      assertEquals(res.status, 500);
    });

    it("toggles a provider enabled/disabled", async () => {
      const addReq = makeRequest("POST", "/api/pri/oidc-provider/add", {
        name: "Toggle SSO",
        issuer_url: "https://toggle.example.com",
        client_id: "cid-t",
        client_secret: "sec-t",
      });
      await routeOidcProvider(
        addReq,
        "/api/pri/oidc-provider/add",
        identityId,
      );

      const listReq = makeRequest(
        "POST",
        "/api/pri/oidc-provider/list",
        {},
      );
      const listRes = await routeOidcProvider(
        listReq,
        "/api/pri/oidc-provider/list",
        identityId,
      );
      const providers = await listRes.json();
      const id = providers[0].id;

      // Enable
      const enableRes = await routeOidcProvider(
        makeRequest("POST", "/api/pri/oidc-provider/toggle", {
          id,
          enabled: true,
        }),
        "/api/pri/oidc-provider/toggle",
        identityId,
      );
      assertEquals(enableRes.status, 200);

      // Disable
      const disableRes = await routeOidcProvider(
        makeRequest("POST", "/api/pri/oidc-provider/toggle", {
          id,
          enabled: false,
        }),
        "/api/pri/oidc-provider/toggle",
        identityId,
      );
      assertEquals(disableRes.status, 200);
    });

    it("toggle returns 500 when id missing", async () => {
      const req = makeRequest("POST", "/api/pri/oidc-provider/toggle", {
        enabled: true,
      });
      const res = await routeOidcProvider(
        req,
        "/api/pri/oidc-provider/toggle",
        identityId,
      );
      assertEquals(res.status, 500);
    });

    it("deletes a provider", async () => {
      const addReq = makeRequest("POST", "/api/pri/oidc-provider/add", {
        name: "Delete SSO",
        issuer_url: "https://delete.example.com",
        client_id: "cid-d",
        client_secret: "sec-d",
      });
      await routeOidcProvider(
        addReq,
        "/api/pri/oidc-provider/add",
        identityId,
      );

      const listReq = makeRequest(
        "POST",
        "/api/pri/oidc-provider/list",
        {},
      );
      const listRes = await routeOidcProvider(
        listReq,
        "/api/pri/oidc-provider/list",
        identityId,
      );
      const providers = await listRes.json();
      const id = providers[0].id;

      const delRes = await routeOidcProvider(
        makeRequest("POST", "/api/pri/oidc-provider/del", { id }),
        "/api/pri/oidc-provider/del",
        identityId,
      );
      assertEquals(delRes.status, 200);
    });

    it("del returns 500 when id missing", async () => {
      const req = makeRequest("POST", "/api/pri/oidc-provider/del", {});
      const res = await routeOidcProvider(
        req,
        "/api/pri/oidc-provider/del",
        identityId,
      );
      assertEquals(res.status, 500);
    });

    it("returns 404 for unknown path", async () => {
      const req = makeRequest(
        "POST",
        "/api/pri/oidc-provider/unknown",
        {},
      );
      const res = await routeOidcProvider(
        req,
        "/api/pri/oidc-provider/unknown",
        identityId,
      );
      assertEquals(res.status, 404);
    });
  },
);
