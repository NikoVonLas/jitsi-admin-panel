import { assertEquals } from "@std/assert";
import {
  afterAll,
  beforeAll,
  describe,
  it,
} from "@std/testing/bdd";
import { cleanDb, makeRequest } from "../../helpers/db.ts";
import handleAuthConfig from "../../../lib/adm/auth-config.ts";
import handleAdmHello from "../../../lib/adm/hello.ts";
import handleLocalRegister from "../../../lib/adm/local-register.ts";

describe("GET /api/adm/auth/config", () => {
  beforeAll(async () => {
    await cleanDb();
  });

  afterAll(async () => {
    await cleanDb();
  });

  it("returns setup=true when no users exist", async () => {
    const res = await handleAuthConfig();
    assertEquals(res.status, 200);
    const body = await res.json();
    assertEquals(body.setup, true);
    assertEquals(body.local, true);
    assertEquals(body.oidc, false);
    assertEquals(Array.isArray(body.oidc_providers), true);
  });

  it("returns setup=false after first user registers", async () => {
    const regReq = makeRequest("POST", "/api/adm/auth/local/register", {
      email: "admin@test.example",
      password: "secure_password_12345",
    });
    await handleLocalRegister(regReq);

    const res = await handleAuthConfig();
    const body = await res.json();
    assertEquals(body.setup, false);
  });
});

describe("GET /api/adm/hello", () => {
  it("returns 200 with hello text", () => {
    const res = handleAdmHello();
    assertEquals(res.status, 200);
  });

  it("response body contains admin text", async () => {
    const res = handleAdmHello();
    const body = await res.json();
    assertEquals(body.text, "hello admin");
  });
});
