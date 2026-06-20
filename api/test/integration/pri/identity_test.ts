import { assertEquals } from "@std/assert";
import {
  afterAll,
  beforeAll,
  describe,
  it,
} from "@std/testing/bdd";
import { cleanDb, makeRequest } from "../../helpers/db.ts";
import { registerFirst } from "../../helpers/auth.ts";
import routeIdentity from "../../../lib/pri/identity.ts";

const EMAIL = "admin@identity-test.example";
const PASSWORD = "secure_identity_pass_123!";

describe("pri/identity", () => {
  let identityId = "";

  beforeAll(async () => {
    await cleanDb();
    const auth = await registerFirst(EMAIL, PASSWORD);
    identityId = auth.identityId;
  });

  afterAll(async () => {
    await cleanDb();
  });

  it("GET /api/pri/identity/role returns role for superadmin", async () => {
    const req = makeRequest("POST", "/api/pri/identity/role", {});
    const res = await routeIdentity(req, "/api/pri/identity/role", identityId);
    assertEquals(res.status, 200);
    const body = await res.json();
    assertEquals(Array.isArray(body), true);
    assertEquals(body[0].is_superadmin, true);
  });

  it("GET /api/pri/identity/ping returns result", async () => {
    const req = makeRequest("POST", "/api/pri/identity/ping", {});
    const res = await routeIdentity(req, "/api/pri/identity/ping", identityId);
    assertEquals(res.status, 200);
  });

  it("search requires at least 2 characters", async () => {
    const req = makeRequest("POST", "/api/pri/identity/search", { q: "a" });
    const res = await routeIdentity(
      req,
      "/api/pri/identity/search",
      identityId,
    );
    assertEquals(res.status, 200);
    const body = await res.json();
    assertEquals(body, []);
  });

  it("search returns results for 2+ chars", async () => {
    const req = makeRequest("POST", "/api/pri/identity/search", {
      q: "admin",
    });
    const res = await routeIdentity(
      req,
      "/api/pri/identity/search",
      identityId,
    );
    assertEquals(res.status, 200);
    const body = await res.json();
    assertEquals(Array.isArray(body), true);
  });

  it("returns 404 for unknown path", async () => {
    const req = makeRequest("POST", "/api/pri/identity/unknown", {});
    const res = await routeIdentity(
      req,
      "/api/pri/identity/unknown",
      identityId,
    );
    assertEquals(res.status, 404);
  });
});
