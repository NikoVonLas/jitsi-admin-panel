// Integration tests for pri/intercom routes.
// All operate with invalid/non-existent IDs, so they return empty results
// but still exercise all code paths.
import { assertEquals } from "@std/assert";
import { afterAll, beforeAll, describe, it } from "@std/testing/bdd";
import { cleanDb, makeRequest } from "../../helpers/db.ts";
import { registerFirst } from "../../helpers/auth.ts";
import routeIntercom from "../../../lib/pri/intercom.ts";

const EMAIL = "admin@intercom-test.example";
const PASSWORD = "secure_intercom_test_pass_123!";

const FAKE_INTERCOM_ID = "00000000-0000-0000-0000-000000000099";

describe(
  "pri/intercom",
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

    it("list returns empty array initially", async () => {
      const req = makeRequest("POST", "/api/pri/intercom/list", {
        value: 0,
      });
      const res = await routeIntercom(
        req,
        "/api/pri/intercom/list",
        identityId,
      );
      assertEquals(res.status, 200);
      const body = await res.json();
      assertEquals(Array.isArray(body), true);
    });

    it("get returns empty array for non-existent intercom", async () => {
      const req = makeRequest("POST", "/api/pri/intercom/get", {
        id: FAKE_INTERCOM_ID,
      });
      const res = await routeIntercom(req, "/api/pri/intercom/get", identityId);
      assertEquals(res.status, 200);
      const body = await res.json();
      assertEquals(Array.isArray(body), true);
    });

    it("del returns empty array for non-existent intercom", async () => {
      const req = makeRequest("POST", "/api/pri/intercom/del", {
        id: FAKE_INTERCOM_ID,
      });
      const res = await routeIntercom(req, "/api/pri/intercom/del", identityId);
      assertEquals(res.status, 200);
    });

    it("del-with-notification returns empty for non-existent", async () => {
      const req = makeRequest(
        "POST",
        "/api/pri/intercom/del-with-notification",
        { id: FAKE_INTERCOM_ID },
      );
      const res = await routeIntercom(
        req,
        "/api/pri/intercom/del-with-notification",
        identityId,
      );
      assertEquals(res.status, 200);
    });

    it("set/accepted returns empty for non-existent intercom", async () => {
      const req = makeRequest("POST", "/api/pri/intercom/set/accepted", {
        id: FAKE_INTERCOM_ID,
      });
      const res = await routeIntercom(
        req,
        "/api/pri/intercom/set/accepted",
        identityId,
      );
      assertEquals(res.status, 200);
    });

    it("set/rejected returns empty for non-existent intercom", async () => {
      const req = makeRequest("POST", "/api/pri/intercom/set/rejected", {
        id: FAKE_INTERCOM_ID,
      });
      const res = await routeIntercom(
        req,
        "/api/pri/intercom/set/rejected",
        identityId,
      );
      assertEquals(res.status, 200);
    });

    it("set/seen returns empty for non-existent intercom", async () => {
      const req = makeRequest("POST", "/api/pri/intercom/set/seen", {
        id: FAKE_INTERCOM_ID,
      });
      const res = await routeIntercom(
        req,
        "/api/pri/intercom/set/seen",
        identityId,
      );
      assertEquals(res.status, 200);
    });

    it("call/ring returns empty for non-existent intercom", async () => {
      const req = makeRequest("POST", "/api/pri/intercom/call/ring", {
        id: FAKE_INTERCOM_ID,
      });
      const res = await routeIntercom(
        req,
        "/api/pri/intercom/call/ring",
        identityId,
      );
      assertEquals(res.status, 200);
    });

    it("returns 404 for unknown path", async () => {
      const req = makeRequest("POST", "/api/pri/intercom/unknown", {});
      const res = await routeIntercom(
        req,
        "/api/pri/intercom/unknown",
        identityId,
      );
      assertEquals(res.status, 404);
    });
  },
);
