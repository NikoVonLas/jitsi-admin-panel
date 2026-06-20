import { assertEquals } from "@std/assert";
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  it,
} from "@std/testing/bdd";
import { cleanDb, makeRequest } from "../../helpers/db.ts";
import handleLocalRegister from "../../../lib/adm/local-register.ts";
import handleLocalLogin from "../../../lib/adm/local-login.ts";
import routeOidcProvider from "../../../lib/adm/oidc-provider.ts";

const EMAIL = "admin@oidctest.example";
const PASSWORD = "secure_oidc_test_pass_123";

async function getAdminToken(): Promise<string> {
  await cleanDb();
  const regReq = makeRequest("POST", "/api/adm/auth/local/register", {
    email: EMAIL,
    password: PASSWORD,
    name: "Admin",
  });
  await handleLocalRegister(regReq);

  const loginReq = makeRequest("POST", "/api/adm/auth/local/login", {
    email: EMAIL,
    password: PASSWORD,
  });
  const loginRes = await handleLocalLogin(loginReq);
  const body = await loginRes.json();
  return body.token as string;
}

describe("OIDC provider CRUD", () => {
  let token = "";

  beforeAll(async () => {
    token = await getAdminToken();
  });

  afterAll(async () => {
    await cleanDb();
  });

  beforeEach(async () => {
    // Clean oidc_providers between tests
    const { query } = await import("../../../lib/database/common.ts");
    await query({ text: "DELETE FROM oidc_provider" });
  });

  it("adds a new OIDC provider", async () => {
    const req = makeRequest(
      "POST",
      "/api/adm/oidc-provider/add",
      {
        name: "Test SSO",
        issuer_url: "https://sso.example.com",
        client_id: "client_test",
        client_secret: "secret123",
        scopes: "openid profile email",
      },
      { Cookie: `token=${token}` },
    );
    const res = await routeOidcProvider(req, "/api/adm/oidc-provider/add");
    assertEquals(res.status, 200);
    const body = await res.json();
    assertEquals(Array.isArray(body), true);
    assertEquals(body.length > 0, true);
    assertEquals(body[0].id !== undefined, true);
  });

  it("lists OIDC providers", async () => {
    // Add one first
    const addReq = makeRequest(
      "POST",
      "/api/adm/oidc-provider/add",
      {
        name: "My SSO",
        issuer_url: "https://issuer.example.com",
        client_id: "client_1",
        client_secret: "",
        scopes: "openid",
      },
      { Cookie: `token=${token}` },
    );
    await routeOidcProvider(addReq, "/api/adm/oidc-provider/add");

    const listReq = makeRequest(
      "POST",
      "/api/adm/oidc-provider/list",
      {},
      { Cookie: `token=${token}` },
    );
    const res = await routeOidcProvider(listReq, "/api/adm/oidc-provider/list");
    assertEquals(res.status, 200);
    const body = await res.json();
    assertEquals(Array.isArray(body), true);
    assertEquals(body.length, 1);
    assertEquals(body[0].name, "My SSO");
  });

  it("returns 404 for unknown path", async () => {
    const req = makeRequest(
      "POST",
      "/api/adm/oidc-provider/unknown",
      {},
      { Cookie: `token=${token}` },
    );
    const res = await routeOidcProvider(req, "/api/adm/oidc-provider/unknown");
    assertEquals(res.status, 404);
  });
});
