import { assertEquals } from "@std/assert";
import { afterAll, beforeAll, describe, it } from "@std/testing/bdd";
import { cleanDb, makeRequest } from "../../helpers/db.ts";
import handleSetting from "../../../lib/adm/setting.ts";

describe(
  "adm/setting",
  { sanitizeResources: false, sanitizeOps: false },
  () => {
    beforeAll(async () => {
      await cleanDb();
    });

    afterAll(async () => {
      await cleanDb();
    });

    it("GET /api/adm/setting/get returns an array", async () => {
      const req = makeRequest("POST", "/api/adm/setting/get", {});
      const res = await handleSetting(req, "/api/adm/setting/get");
      assertEquals(res.status, 200);
      const body = await res.json();
      assertEquals(Array.isArray(body), true);
    });

    it("POST /api/adm/setting/update saves allowed keys", async () => {
      const req = makeRequest("POST", "/api/adm/setting/update", {
        contact_email: "admin@example.com",
      });
      const res = await handleSetting(req, "/api/adm/setting/update");
      assertEquals(res.status, 200);
      const body = await res.json();
      assertEquals(Array.isArray(body), true);
      // contact_email should appear in the result
      const item = (body as { mkey: string; mvalue: string }[]).find(
        (s) => s.mkey === "contact_email",
      );
      assertEquals(item?.mvalue, "admin@example.com");
    });

    it("POST /api/adm/setting/update ignores unknown keys", async () => {
      const req = makeRequest("POST", "/api/adm/setting/update", {
        unknown_key: "value",
      });
      const res = await handleSetting(req, "/api/adm/setting/update");
      assertEquals(res.status, 200);
      const body = await res.json();
      // unknown_key should not appear
      const item = (body as { mkey: string }[]).find(
        (s) => s.mkey === "unknown_key",
      );
      assertEquals(item, undefined);
    });

    it("does not return mailer_pass (secret key) in get response", async () => {
      // First write a value
      const updateReq = makeRequest("POST", "/api/adm/setting/update", {
        mailer_pass: "supersecret",
      });
      await handleSetting(updateReq, "/api/adm/setting/update");

      const getReq = makeRequest("POST", "/api/adm/setting/get", {});
      const res = await handleSetting(getReq, "/api/adm/setting/get");
      const body = await res.json();
      const secret = (body as { mkey: string }[]).find(
        (s) => s.mkey === "mailer_pass",
      );
      assertEquals(secret, undefined);
    });

    it("returns 404 for unknown path", async () => {
      const req = makeRequest("POST", "/api/adm/setting/unknown", {});
      const res = await handleSetting(req, "/api/adm/setting/unknown");
      assertEquals(res.status, 404);
    });
  },
);
