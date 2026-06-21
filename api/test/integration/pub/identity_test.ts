import { assertEquals } from "@std/assert";
import { afterAll, beforeAll, describe, it } from "@std/testing/bdd";
import { cleanDb, makeRequest } from "../../helpers/db.ts";
import handlePubIdentity from "../../../lib/pub/identity.ts";

describe("pub/identity", {
  sanitizeResources: false,
  sanitizeOps: false,
}, () => {
  beforeAll(async () => {
    await cleanDb();
  });

  afterAll(async () => {
    await cleanDb();
  });

  it("pingByKey with non-existent key returns 200 with empty result", async () => {
    const req = makeRequest("POST", "/api/pub/identity/ping/bykey", {
      key_value: "nonexistent-key-value-xyz",
    });
    const res = await handlePubIdentity(req, "/api/pub/identity/ping/bykey");
    assertEquals(res.status, 200);
    const body = await res.json();
    assertEquals(Array.isArray(body), true);
  });

  it("returns 404 for unknown path", async () => {
    const req = makeRequest("POST", "/api/pub/identity/unknown", {});
    const res = await handlePubIdentity(req, "/api/pub/identity/unknown");
    assertEquals(res.status, 404);
  });
});
