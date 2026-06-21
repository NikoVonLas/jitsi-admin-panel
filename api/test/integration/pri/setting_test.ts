import { assertEquals } from "@std/assert";
import {
  afterAll,
  beforeAll,
  describe,
  it,
} from "@std/testing/bdd";
import { cleanDb, makeRequest } from "../../helpers/db.ts";
import { registerFirst } from "../../helpers/auth.ts";
import routeSetting from "../../../lib/pri/setting.ts";

const EMAIL = "admin@setting-test.example";
const PASSWORD = "secure_setting_test_pass_123";

describe("pri/setting", () => {
  let identityId = "";

  beforeAll(async () => {
    await cleanDb();
    const auth = await registerFirst(EMAIL, PASSWORD);
    identityId = auth.identityId;
  });

  afterAll(async () => {
    await cleanDb();
  });

  it("gets settings (empty object initially)", async () => {
    const req = makeRequest("POST", "/api/pri/setting/get", {});
    const res = await routeSetting(req, "/api/pri/setting/get", identityId);
    assertEquals(res.status, 200);
    const body = await res.json();
    assertEquals(typeof body, "object");
    assertEquals(Array.isArray(body), false);
  });

  it("updates a setting value", async () => {
    const req = makeRequest("POST", "/api/pri/setting/update", {
      intercom_url: "https://intercom.example.com",
    });
    const res = await routeSetting(
      req,
      "/api/pri/setting/update",
      identityId,
    );
    assertEquals(res.status, 200);
    const body = await res.json();
    assertEquals(typeof body, "object");
    assertEquals(body.intercom_url, "https://intercom.example.com");
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
});
