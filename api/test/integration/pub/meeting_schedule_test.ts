import { assertEquals } from "@std/assert";
import { afterAll, beforeAll, describe, it } from "@std/testing/bdd";
import { cleanDb, makeRequest } from "../../helpers/db.ts";
import handlePubMeetingSchedule from "../../../lib/pub/meeting-schedule.ts";

describe("pub/meeting/schedule", {
  sanitizeResources: false,
  sanitizeOps: false,
}, () => {
  beforeAll(async () => {
    await cleanDb();
  });

  afterAll(async () => {
    await cleanDb();
  });

  it("joinAsMod with missing fields returns 200 with empty array", async () => {
    const req = makeRequest(
      "POST",
      "/api/pub/meeting/schedule/join/asmod",
      {},
    );
    const res = await handlePubMeetingSchedule(
      req,
      "/api/pub/meeting/schedule/join/asmod",
    );
    assertEquals(res.status, 200);
    const body = await res.json();
    assertEquals(body, []);
  });

  it("returns 404 for unknown path", async () => {
    const req = makeRequest("POST", "/api/pub/meeting/schedule/unknown", {});
    const res = await handlePubMeetingSchedule(
      req,
      "/api/pub/meeting/schedule/unknown",
    );
    assertEquals(res.status, 404);
  });
});
