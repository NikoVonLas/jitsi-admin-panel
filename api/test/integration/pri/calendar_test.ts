import { assertEquals } from "@std/assert";
import { afterAll, beforeAll, describe, it } from "@std/testing/bdd";
import { cleanDb, makeRequest } from "../../helpers/db.ts";
import { registerFirst } from "../../helpers/auth.ts";
import routeCalendar from "../../../lib/pri/calendar.ts";

const EMAIL = "admin@calendar-test.example";
const PASSWORD = "secure_calendar_pass_123";

describe("pri/calendar", {
  sanitizeResources: false,
  sanitizeOps: false,
}, () => {
  let identityId = "";

  beforeAll(async () => {
    await cleanDb();
    const auth = await registerFirst(EMAIL, PASSWORD);
    identityId = auth.identityId;
  });

  afterAll(async () => {
    await cleanDb();
  });

  it("listByMonth returns 200 and array", async () => {
    const req = makeRequest("POST", "/api/pri/calendar/list/bymonth", {
      value: "2024-06-01",
      limit: 10,
      offset: 0,
    });
    const res = await routeCalendar(
      req,
      "/api/pri/calendar/list/bymonth",
      identityId,
    );
    assertEquals(res.status, 200);
    const body = await res.json();
    assertEquals(Array.isArray(body), true);
  });

  it("getToken returns 200 and token", async () => {
    const req = makeRequest("POST", "/api/pri/calendar/token/get", {});
    const res = await routeCalendar(
      req,
      "/api/pri/calendar/token/get",
      identityId,
    );
    assertEquals(res.status, 200);
    const body = await res.json();
    assertEquals(Array.isArray(body), true);
    assertEquals(typeof body[0].token, "string");
  });

  it("regenerateToken returns 200 and a different token", async () => {
    const getReq = makeRequest("POST", "/api/pri/calendar/token/get", {});
    const getRes = await routeCalendar(
      getReq,
      "/api/pri/calendar/token/get",
      identityId,
    );
    const getBody = await getRes.json();
    const oldToken = getBody[0].token as string;

    const req = makeRequest("POST", "/api/pri/calendar/token/regenerate", {});
    const res = await routeCalendar(
      req,
      "/api/pri/calendar/token/regenerate",
      identityId,
    );
    assertEquals(res.status, 200);
    const body = await res.json();
    assertEquals(Array.isArray(body), true);
    assertEquals(typeof body[0].token, "string");
    assertEquals(body[0].token !== oldToken, true);
  });

  it("returns 404 for unknown path", async () => {
    const req = makeRequest("POST", "/api/pri/calendar/unknown", {});
    const res = await routeCalendar(
      req,
      "/api/pri/calendar/unknown",
      identityId,
    );
    assertEquals(res.status, 404);
  });
});
