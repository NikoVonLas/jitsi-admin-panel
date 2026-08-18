import { assertEquals } from "@std/assert";
import { afterAll, beforeAll, describe, it } from "@std/testing/bdd";
import { cleanDb, makeRequest } from "../../helpers/db.ts";
import { registerFirst } from "../../helpers/auth.ts";
import routeProfile from "../../../lib/pri/profile.ts";
import { createLocalIdentity } from "../../../lib/database/identity-local.ts";
import { hashPassword } from "../../../lib/common/password.ts";

const EMAIL = "admin@profile-test.example";
const PASSWORD = "secure_profile_test_pass_123";

function makeUploadRequest(path: string, file: File): Request {
  const form = new FormData();
  form.append("file", file);
  return new Request(`http://test${path}`, { method: "POST", body: form });
}

describe(
  "pri/profile",
  { sanitizeResources: false, sanitizeOps: false },
  () => {
    let identityId = "";
    let regularIdentityId = "";

    beforeAll(async () => {
      await cleanDb();
      const auth = await registerFirst(EMAIL, PASSWORD);
      identityId = auth.identityId;
      const rows = await createLocalIdentity(
        "regular@profile-test.example",
        await hashPassword("regular_profile_test_pass_123"),
      );
      regularIdentityId = rows[0].id;
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

    it("gets the default profile", async () => {
      const req = makeRequest("POST", "/api/pri/profile/get/default", {});
      const res = await routeProfile(
        req,
        "/api/pri/profile/get/default",
        identityId,
      );
      assertEquals(res.status, 200);
      const body = await res.json();
      assertEquals(Array.isArray(body), true);
      assertEquals(body.length >= 1, true);
    });

    it("sets a profile as default", async () => {
      // Add a second profile to set as default
      const addReq = makeRequest("POST", "/api/pri/profile/add", {
        name: "Default Candidate",
        email: "default-cand@example.com",
      });
      const addRes = await routeProfile(
        addReq,
        "/api/pri/profile/add",
        identityId,
      );
      const addBody = await addRes.json();
      const profileId = addBody[0].id;

      const setReq = makeRequest("POST", "/api/pri/profile/set/default", {
        id: profileId,
      });
      const setRes = await routeProfile(
        setReq,
        "/api/pri/profile/set/default",
        identityId,
      );
      assertEquals(setRes.status, 200);
    });

    it("deletes a profile", async () => {
      // Add a profile to delete
      const addReq = makeRequest("POST", "/api/pri/profile/add", {
        name: "To Delete",
        email: "to-delete@example.com",
      });
      const addRes = await routeProfile(
        addReq,
        "/api/pri/profile/add",
        identityId,
      );
      const addBody = await addRes.json();
      const profileId = addBody[0].id;

      const delReq = makeRequest("POST", "/api/pri/profile/del", {
        id: profileId,
      });
      const delRes = await routeProfile(
        delReq,
        "/api/pri/profile/del",
        identityId,
      );
      assertEquals(delRes.status, 200);
    });

    it("rejects global branding changes from a regular user", async () => {
      for (
        const path of [
          "/api/pri/profile/logo/upload",
          "/api/pri/profile/logo/reset",
          "/api/pri/profile/favicon/upload",
          "/api/pri/profile/favicon/reset",
        ]
      ) {
        const res = await routeProfile(
          makeRequest("POST", path, {}),
          path,
          regularIdentityId,
        );
        assertEquals(res.status, 403);
      }
    });

    it("rejects SVG branding and spoofed raster content", async () => {
      for (
        const path of [
          "/api/pri/profile/logo/upload",
          "/api/pri/profile/favicon/upload",
        ]
      ) {
        const svg = new File(
          ["<svg><script>alert(1)</script></svg>"],
          "x.svg",
          {
            type: "image/svg+xml",
          },
        );
        const svgRes = await routeProfile(
          makeUploadRequest(path, svg),
          path,
          identityId,
        );
        assertEquals(svgRes.status, 400);

        const spoofedPng = new File(["not a png"], "x.png", {
          type: "image/png",
        });
        const spoofedRes = await routeProfile(
          makeUploadRequest(path, spoofedPng),
          path,
          identityId,
        );
        assertEquals(spoofedRes.status, 400);
      }
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
