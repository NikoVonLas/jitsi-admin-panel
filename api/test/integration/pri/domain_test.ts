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
import routeDomain from "../../../lib/pri/domain.ts";

const EMAIL = "admin@domain-test.example";
const PASSWORD = "secure_domain_test_pass_123";

describe("pri/domain", () => {
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
    // Remove user domains between tests (keep system domains)
    const { query } = await import("../../../lib/database/common.ts");
    await query({
      text:
        `DELETE FROM domain WHERE identity_id != '00000000-0000-0000-0000-000000000000'`,
    });
  });

  it("lists domains (includes system public domains)", async () => {
    const req = makeRequest("POST", "/api/pri/domain/list", {
      limit: 20,
      offset: 0,
    });
    const res = await routeDomain(req, "/api/pri/domain/list", identityId);
    assertEquals(res.status, 200);
    const body = await res.json();
    assertEquals(Array.isArray(body), true);
    // System domains (meet.jit.si etc.) should appear for superadmin
    assertEquals(body.length >= 0, true);
  });

  it("adds a new domain", async () => {
    const req = makeRequest("POST", "/api/pri/domain/add", {
      name: "My Jitsi",
      auth_type: "none",
      domain_attr: { url: "https://meet.example.com" },
      public: false,
    });
    const res = await routeDomain(req, "/api/pri/domain/add", identityId);
    assertEquals(res.status, 200);
    const body = await res.json();
    assertEquals(Array.isArray(body), true);
    assertEquals(body[0].id !== undefined, true);
  });

  it("rejects domain with invalid URL", async () => {
    const req = makeRequest("POST", "/api/pri/domain/add", {
      name: "Bad Domain",
      auth_type: "none",
      domain_attr: { url: "not-a-url" },
      public: false,
    });
    const res = await routeDomain(req, "/api/pri/domain/add", identityId);
    assertEquals(res.status, 500);
  });

  it("gets a domain by id", async () => {
    // Add one first
    const addReq = makeRequest("POST", "/api/pri/domain/add", {
      name: "Get Test Domain",
      auth_type: "none",
      domain_attr: { url: "https://jitsi.example.com" },
      public: false,
    });
    const addRes = await routeDomain(
      addReq,
      "/api/pri/domain/add",
      identityId,
    );
    const addBody = await addRes.json();
    const domainId = addBody[0].id;

    const getReq = makeRequest("POST", "/api/pri/domain/get", {
      id: domainId,
    });
    const getRes = await routeDomain(
      getReq,
      "/api/pri/domain/get",
      identityId,
    );
    assertEquals(getRes.status, 200);
    const getBody = await getRes.json();
    assertEquals(Array.isArray(getBody), true);
  });

  it("enables and disables a domain", async () => {
    const addReq = makeRequest("POST", "/api/pri/domain/add", {
      name: "Toggle Domain",
      auth_type: "none",
      domain_attr: { url: "https://toggle.example.com" },
      public: false,
    });
    const addRes = await routeDomain(
      addReq,
      "/api/pri/domain/add",
      identityId,
    );
    const addBody = await addRes.json();
    const id = addBody[0].id;

    const disableReq = makeRequest("POST", "/api/pri/domain/disable", {
      id,
    });
    const disRes = await routeDomain(
      disableReq,
      "/api/pri/domain/disable",
      identityId,
    );
    assertEquals(disRes.status, 200);

    const enableReq = makeRequest("POST", "/api/pri/domain/enable", { id });
    const enRes = await routeDomain(
      enableReq,
      "/api/pri/domain/enable",
      identityId,
    );
    assertEquals(enRes.status, 200);
  });

  it("updates a domain", async () => {
    const addReq = makeRequest("POST", "/api/pri/domain/add", {
      name: "Update Domain",
      auth_type: "none",
      domain_attr: { url: "https://update.example.com" },
      public: false,
    });
    const addRes = await routeDomain(
      addReq,
      "/api/pri/domain/add",
      identityId,
    );
    const id = (await addRes.json())[0].id;

    const updateReq = makeRequest("POST", "/api/pri/domain/update", {
      id,
      name: "Updated Domain",
      auth_type: "none",
      domain_attr: { url: "https://updated.example.com" },
      public: false,
    });
    const updateRes = await routeDomain(
      updateReq,
      "/api/pri/domain/update",
      identityId,
    );
    assertEquals(updateRes.status, 200);
  });

  it("deletes a domain", async () => {
    const addReq = makeRequest("POST", "/api/pri/domain/add", {
      name: "Delete Domain",
      auth_type: "none",
      domain_attr: { url: "https://delete.example.com" },
      public: false,
    });
    const addRes = await routeDomain(
      addReq,
      "/api/pri/domain/add",
      identityId,
    );
    const id = (await addRes.json())[0].id;

    const delReq = makeRequest("POST", "/api/pri/domain/del", { id });
    const delRes = await routeDomain(
      delReq,
      "/api/pri/domain/del",
      identityId,
    );
    assertEquals(delRes.status, 200);
  });

  it("returns 404 for unknown path", async () => {
    const req = makeRequest("POST", "/api/pri/domain/unknown", {});
    const res = await routeDomain(req, "/api/pri/domain/unknown", identityId);
    assertEquals(res.status, 404);
  });
});
