import { assertEquals } from "@std/assert";
import { afterAll, beforeAll, describe, it } from "@std/testing/bdd";
import { cleanDb, makeRequest } from "../../helpers/db.ts";
import { registerFirst } from "../../helpers/auth.ts";
import routeLocalUser from "../../../lib/pri/local-user.ts";

const EMAIL = "admin@local-user-test.example";
const PASSWORD = "secure_localuser_test_pass_123";

describe("pri/user (local user management)", () => {
  let identityId = "";

  beforeAll(async () => {
    await cleanDb();
    const auth = await registerFirst(EMAIL, PASSWORD);
    identityId = auth.identityId;
  });

  afterAll(async () => {
    await cleanDb();
  });

  it("lists local users (at least the admin)", async () => {
    const req = makeRequest("POST", "/api/pri/user/list", {});
    const res = await routeLocalUser(req, "/api/pri/user/list", identityId);
    assertEquals(res.status, 200);
    const body = await res.json();
    assertEquals(Array.isArray(body), true);
    assertEquals(body.length >= 1, true);
    const admin = body.find((u: { email: string }) => u.email === EMAIL);
    assertEquals(admin !== undefined, true);
  });

  it("adds a new local user", async () => {
    const req = makeRequest("POST", "/api/pri/user/add", {
      email: "newuser@local-user-test.example",
      password: "newuser_secure_pass_456",
      name: "New User",
      is_superadmin: false,
    });
    const res = await routeLocalUser(req, "/api/pri/user/add", identityId);
    assertEquals(res.status, 200);
    const body = await res.json();
    assertEquals(body.email, "newuser@local-user-test.example");
    assertEquals(body.name, "New User");
    assertEquals(body.is_superadmin, false);
  });

  it("rejects duplicate email on add", async () => {
    const req = makeRequest("POST", "/api/pri/user/add", {
      email: EMAIL,
      password: "duplicate_email_pass_123",
      name: "Duplicate",
      is_superadmin: false,
    });
    const res = await routeLocalUser(req, "/api/pri/user/add", identityId);
    // conflict → 500 from wrapper (throws "conflict")
    assertEquals(res.status, 500);
  });

  it("rejects add with short password", async () => {
    const req = makeRequest("POST", "/api/pri/user/add", {
      email: "short@local-user-test.example",
      password: "short",
      name: "Short Pass",
      is_superadmin: false,
    });
    const res = await routeLocalUser(req, "/api/pri/user/add", identityId);
    assertEquals(res.status, 500);
  });

  it("promotes and demotes superadmin flag", async () => {
    const { query } = await import("../../../lib/database/common.ts");

    // Add a second user to promote
    const addReq = makeRequest("POST", "/api/pri/user/add", {
      email: "promote@local-user-test.example",
      password: "promote_secure_pass_789",
      name: "Promote User",
      is_superadmin: false,
    });
    const addRes = await routeLocalUser(
      addReq,
      "/api/pri/user/add",
      identityId,
    );
    const addBody = await addRes.json();
    const newId = addBody.id as string;

    // Promote
    const promoteReq = makeRequest("POST", "/api/pri/user/set-admin", {
      id: newId,
      is_superadmin: true,
    });
    const promoteRes = await routeLocalUser(
      promoteReq,
      "/api/pri/user/set-admin",
      identityId,
    );
    assertEquals(promoteRes.status, 200);
    const promoteBody = await promoteRes.json();
    assertEquals(promoteBody.ok, true);

    // Demote back
    const demoteReq = makeRequest("POST", "/api/pri/user/set-admin", {
      id: newId,
      is_superadmin: false,
    });
    const demoteRes = await routeLocalUser(
      demoteReq,
      "/api/pri/user/set-admin",
      identityId,
    );
    assertEquals(demoteRes.status, 200);

    // Cleanup
    await query({
      text: `DELETE FROM identity WHERE id = $1`,
      args: [newId],
    });
  });

  it("prevents removing the last superadmin", async () => {
    const req = makeRequest("POST", "/api/pri/user/set-admin", {
      id: identityId,
      is_superadmin: false,
    });
    const res = await routeLocalUser(
      req,
      "/api/pri/user/set-admin",
      identityId,
    );
    assertEquals(res.status, 500);
  });

  it("deletes a user", async () => {
    const addReq = makeRequest("POST", "/api/pri/user/add", {
      email: "todelete@local-user-test.example",
      password: "todelete_secure_pass_999",
      name: "To Delete",
      is_superadmin: false,
    });
    const addRes = await routeLocalUser(
      addReq,
      "/api/pri/user/add",
      identityId,
    );
    const addBody = await addRes.json();
    const newId = addBody.id as string;

    const delReq = makeRequest("POST", "/api/pri/user/del", { id: newId });
    const delRes = await routeLocalUser(
      delReq,
      "/api/pri/user/del",
      identityId,
    );
    assertEquals(delRes.status, 200);
    const delBody = await delRes.json();
    assertEquals(delBody.ok, true);
  });

  it("prevents deleting yourself", async () => {
    const req = makeRequest("POST", "/api/pri/user/del", { id: identityId });
    const res = await routeLocalUser(req, "/api/pri/user/del", identityId);
    assertEquals(res.status, 500);
  });

  it("returns 404 for unknown path", async () => {
    const req = makeRequest("POST", "/api/pri/user/unknown", {});
    const res = await routeLocalUser(
      req,
      "/api/pri/user/unknown",
      identityId,
    );
    assertEquals(res.status, 404);
  });
});
