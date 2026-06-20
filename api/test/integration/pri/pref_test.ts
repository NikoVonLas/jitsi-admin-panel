import { assertEquals } from "@std/assert";
import {
  afterAll,
  beforeAll,
  describe,
  it,
} from "@std/testing/bdd";
import { cleanDb, makeRequest } from "../../helpers/db.ts";
import { registerFirst } from "../../helpers/auth.ts";
import routePref from "../../../lib/pri/pref.ts";

const EMAIL = "admin@pref-test.example";
const PASSWORD = "secure_pref_test_pass_123";

describe("pri/pref", () => {
  let identityId = "";

  beforeAll(async () => {
    await cleanDb();
    const auth = await registerFirst(EMAIL, PASSWORD);
    identityId = auth.identityId;
  });

  afterAll(async () => {
    await cleanDb();
  });

  it("GET /api/pri/pref/get returns default prefs", async () => {
    const req = makeRequest("POST", "/api/pri/pref/get", {});
    const res = await routePref(req, "/api/pri/pref/get", identityId);
    assertEquals(res.status, 200);
    const body = await res.json();
    // Default prefs — pref_lang and pref_theme may be null
    assertEquals(
      body.pref_lang === null || typeof body.pref_lang === "string",
      true,
    );
  });

  it("POST /api/pri/pref/update saves lang preference", async () => {
    const req = makeRequest("POST", "/api/pri/pref/update", { lang: "ru" });
    const res = await routePref(req, "/api/pri/pref/update", identityId);
    assertEquals(res.status, 200);
    const body = await res.json();
    assertEquals(body.pref_lang, "ru");
  });

  it("POST /api/pri/pref/update saves theme preference", async () => {
    const req = makeRequest("POST", "/api/pri/pref/update", {
      lang: "en",
      theme: "dark",
    });
    const res = await routePref(req, "/api/pri/pref/update", identityId);
    assertEquals(res.status, 200);
    const body = await res.json();
    assertEquals(body.pref_theme, "dark");
  });

  it("returns 404 for unknown path", async () => {
    const req = makeRequest("POST", "/api/pri/pref/unknown", {});
    const res = await routePref(req, "/api/pri/pref/unknown", identityId);
    assertEquals(res.status, 404);
  });
});
