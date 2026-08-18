import { assertEquals } from "@std/assert";
import { afterAll, beforeAll, describe, it } from "@std/testing/bdd";
import { cleanDb, makeRequest } from "../../helpers/db.ts";
import { registerFirst } from "../../helpers/auth.ts";
import routeSetting from "../../../lib/pri/setting.ts";
import { createLocalIdentity } from "../../../lib/database/identity-local.ts";
import { hashPassword } from "../../../lib/common/password.ts";

const EMAIL = "admin@setting-test.example";
const PASSWORD = "secure_setting_test_pass_123";

describe(
  "pri/setting",
  { sanitizeResources: false, sanitizeOps: false },
  () => {
    let identityId = "";
    let regularIdentityId = "";

    beforeAll(async () => {
      await cleanDb();
      const auth = await registerFirst(EMAIL, PASSWORD);
      identityId = auth.identityId;
      const rows = await createLocalIdentity(
        "regular@setting-test.example",
        await hashPassword("regular_setting_test_pass_123"),
      );
      regularIdentityId = rows[0].id;
    });

    afterAll(async () => {
      await cleanDb();
    });

    it("gets settings (returns array of {mkey,mvalue})", async () => {
      const req = makeRequest("POST", "/api/pri/setting/get", {});
      const res = await routeSetting(req, "/api/pri/setting/get", identityId);
      assertEquals(res.status, 200);
      const body = await res.json();
      assertEquals(Array.isArray(body), true);
    });

    it("updates an allowed setting key", async () => {
      const req = makeRequest("POST", "/api/pri/setting/update", {
        logo_url: "https://example.com/logo.png",
      });
      const res = await routeSetting(
        req,
        "/api/pri/setting/update",
        identityId,
      );
      assertEquals(res.status, 200);
      const body = await res.json();
      assertEquals(Array.isArray(body), true);
      const row = body.find(
        (r: { mkey: string }) => r.mkey === "logo_url",
      );
      assertEquals(row?.mvalue, "https://example.com/logo.png");
    });

    it("rejects reads and writes from a regular user", async () => {
      for (
        const [path, body] of [
          ["/api/pri/setting/get", {}],
          ["/api/pri/setting/update", { logo_url: "https://bad.example" }],
        ] as const
      ) {
        const res = await routeSetting(
          makeRequest("POST", path, body),
          path,
          regularIdentityId,
        );
        assertEquals(res.status, 403);
      }
    });

    it("returns 404 for unknown path", async () => {
      const req = makeRequest("POST", "/api/pri/setting/unknown", {});
      const res = await routeSetting(
        req,
        "/api/pri/setting/unknown",
        identityId,
      );
      assertEquals(res.status, 404);
    });
  },
);
