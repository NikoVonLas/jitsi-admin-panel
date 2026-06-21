import { assertEquals } from "@std/assert";
import { afterAll, beforeAll, describe, it } from "@std/testing/bdd";
import { cleanDb, makeRequest } from "../../helpers/db.ts";
import { registerFirst } from "../../helpers/auth.ts";
import routeProfile from "../../../lib/pri/profile.ts";

const EMAIL = "admin@profile-test.example";
const PASSWORD = "secure_profile_test_pass_123";

describe(
  "pri/profile",
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

    it("lists profiles (should have one default profile after register)", async () => {
      const req = makeRequest("POST", "/api/pri/profile/list", {
        limit: 20,
        offset: 0,
      });
      const res = await routeProfile(req, "/api/pri/profile/list", identityId);
      assertEquals(res.status, 200);
      const body = await res.json();
      assertEquals(Array.isArray(body), true);
      assertEquals(body.length >= 1, true);
    });

    it("adds a new profile", async () => {
      const req = makeRequest("POST", "/api/pri/profile/add", {
        name: "Secondary Profile",
        email: "secondary@example.com",
      });
      const res = await routeProfile(req, "/api/pri/profile/add", identityId);
      assertEquals(res.status, 200);
      const body = await res.json();
      assertEquals(Array.isArray(body), true);
    });

    it("gets a profile by id", async () => {
      // Add a profile first
      const addReq = makeRequest("POST", "/api/pri/profile/add", {
        name: "Get Profile",
        email: "get@example.com",
      });
      const addRes = await routeProfile(
        addReq,
        "/api/pri/profile/add",
        identityId,
      );
      const addBody = await addRes.json();
      const profileId = addBody[0].id;

      const getReq = makeRequest("POST", "/api/pri/profile/get", {
        id: profileId,
      });
      const getRes = await routeProfile(
        getReq,
        "/api/pri/profile/get",
        identityId,
      );
      assertEquals(getRes.status, 200);
      const getBody = await getRes.json();
      assertEquals(Array.isArray(getBody), true);
    });

    it("updates a profile", async () => {
      // Get existing profile first
      const listReq = makeRequest("POST", "/api/pri/profile/list", {
        limit: 1,
        offset: 0,
      });
      const listRes = await routeProfile(
        listReq,
        "/api/pri/profile/list",
        identityId,
      );
      const listBody = await listRes.json();
      const profileId = listBody[0].id;

      const updateReq = makeRequest("POST", "/api/pri/profile/update", {
        id: profileId,
        name: "Updated Name",
        email: "updated@example.com",
      });
      const updateRes = await routeProfile(
        updateReq,
        "/api/pri/profile/update",
        identityId,
      );
      assertEquals(updateRes.status, 200);
    });

    it("returns 404 for unknown path", async () => {
      const req = makeRequest("POST", "/api/pri/profile/unknown", {});
      const res = await routeProfile(
        req,
        "/api/pri/profile/unknown",
        identityId,
      );
      assertEquals(res.status, 404);
    });
  },
);
