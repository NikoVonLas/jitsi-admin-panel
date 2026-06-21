import { assertEquals } from "@std/assert";
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  it,
} from "@std/testing/bdd";
import { cleanDb, makeRequest } from "../../helpers/db.ts";
import { registerFirst } from "../../helpers/auth.ts";
import routeDomain from "../../../lib/pri/domain.ts";
import routeRoom from "../../../lib/pri/room.ts";
import routeMeeting from "../../../lib/pri/meeting.ts";
import routeProfile from "../../../lib/pri/profile.ts";
import routeMeetingSchedule from "../../../lib/pri/meeting-schedule.ts";

const EMAIL = "admin@meeting-schedule-test.example";
const PASSWORD = "secure_schedule_test_pass_123";

async function setupMeeting(identityId: string): Promise<{
  meetingId: string;
}> {
  // Domain
  const dReq = makeRequest("POST", "/api/pri/domain/add", {
    name: "Schedule Test Domain",
    auth_type: "none",
    domain_attr: { url: "https://meet.schedule-test.example" },
    public: false,
  });
  const dRes = await routeDomain(dReq, "/api/pri/domain/add", identityId);
  const dBody = await dRes.json();
  const domainId = dBody[0].id as string;

  // Room
  const rReq = makeRequest("POST", "/api/pri/room/add", {
    domain_id: domainId,
    name: "schedule-room",
    label: "Schedule Room",
  });
  const rRes = await routeRoom(rReq, "/api/pri/room/add", identityId);
  const rBody = await rRes.json();
  const roomId = rBody[0].id as string;

  // Profile
  const pReq = makeRequest("POST", "/api/pri/profile/list", {
    limit: 5,
    offset: 0,
  });
  const pRes = await routeProfile(pReq, "/api/pri/profile/list", identityId);
  const pBody = await pRes.json();
  const profileId = pBody[0].id as string;

  // Meeting
  const mReq = makeRequest("POST", "/api/pri/meeting/add", {
    profile_id: profileId,
    room_id: roomId,
    name: "Schedule Test Meeting",
    info: "",
    hidden: false,
    subscribable: false,
  });
  const mRes = await routeMeeting(mReq, "/api/pri/meeting/add", identityId);
  const mBody = await mRes.json();
  const meetingId = mBody[0].id as string;

  return { meetingId };
}

// One-off schedule starting 1 hour from now, lasting 60 minutes.
function makeScheduleAttr() {
  const startedAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();
  return { type: "o", duration: "60", started_at: startedAt };
}

function makeDailyAttr() {
  return {
    type: "d",
    duration: "60",
    started_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    rep_end_type: "x",
    rep_end_x: "3",
    rep_every: "1",
  };
}

function makeWeeklyAttr() {
  const startedAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();
  const repEndAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
    .toISOString();
  return {
    type: "w",
    duration: "60",
    started_at: startedAt,
    rep_end_type: "at",
    rep_end_at: repEndAt,
    rep_every: "1",
    rep_days: "1111111",
    timezone_offset: "0",
  };
}

function makeMonthlyAttr() {
  const startedAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();
  const repEndAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
    .toISOString();
  return {
    type: "m",
    duration: "60",
    started_at: startedAt,
    rep_end_type: "at",
    rep_end_at: repEndAt,
    rep_every: "1",
    timezone_offset: "0",
    rep_month_mode: "d",
    rep_month_day: "15",
  };
}

describe("pri/meeting/schedule", {
  sanitizeResources: false,
  sanitizeOps: false,
}, () => {
  let identityId = "";
  let meetingId = "";

  beforeAll(async () => {
    await cleanDb();
    const auth = await registerFirst(EMAIL, PASSWORD);
    identityId = auth.identityId;
    const setup = await setupMeeting(identityId);
    meetingId = setup.meetingId;
  });

  afterAll(async () => {
    await cleanDb();
  });

  beforeEach(async () => {
    const { query } = await import("../../../lib/database/common.ts");
    await query({
      text: `DELETE FROM meeting_schedule WHERE meeting_id = $1`,
      args: [meetingId],
    });
  });

  it("lists schedules by meeting (empty initially)", async () => {
    const req = makeRequest(
      "POST",
      "/api/pri/meeting/schedule/list/bymeeting",
      {
        id: meetingId,
        limit: 20,
        offset: 0,
      },
    );
    const res = await routeMeetingSchedule(
      req,
      "/api/pri/meeting/schedule/list/bymeeting",
      identityId,
    );
    assertEquals(res.status, 200);
    const body = await res.json();
    assertEquals(Array.isArray(body), true);
  });

  it("adds a meeting schedule", async () => {
    const req = makeRequest("POST", "/api/pri/meeting/schedule/add", {
      meeting_id: meetingId,
      schedule_attr: makeScheduleAttr(),
    });
    const res = await routeMeetingSchedule(
      req,
      "/api/pri/meeting/schedule/add",
      identityId,
    );
    assertEquals(res.status, 200);
    const body = await res.json();
    assertEquals(Array.isArray(body), true);
    assertEquals(typeof body[0].id, "string");
  });

  it("gets a schedule by id", async () => {
    const addReq = makeRequest("POST", "/api/pri/meeting/schedule/add", {
      meeting_id: meetingId,
      schedule_attr: makeScheduleAttr(),
    });
    const addRes = await routeMeetingSchedule(
      addReq,
      "/api/pri/meeting/schedule/add",
      identityId,
    );
    const addBody = await addRes.json();
    const scheduleId = addBody[0].id as string;

    const req = makeRequest("POST", "/api/pri/meeting/schedule/get", {
      id: scheduleId,
    });
    const res = await routeMeetingSchedule(
      req,
      "/api/pri/meeting/schedule/get",
      identityId,
    );
    assertEquals(res.status, 200);
    const body = await res.json();
    assertEquals(Array.isArray(body), true);
    assertEquals(body[0].id, scheduleId);
  });

  it("gets schedule by meeting", async () => {
    const addReq = makeRequest("POST", "/api/pri/meeting/schedule/add", {
      meeting_id: meetingId,
      schedule_attr: makeScheduleAttr(),
    });
    await routeMeetingSchedule(
      addReq,
      "/api/pri/meeting/schedule/add",
      identityId,
    );

    const req = makeRequest("POST", "/api/pri/meeting/schedule/get/bymeeting", {
      id: meetingId,
    });
    const res = await routeMeetingSchedule(
      req,
      "/api/pri/meeting/schedule/get/bymeeting",
      identityId,
    );
    assertEquals(res.status, 200);
    const body = await res.json();
    assertEquals(Array.isArray(body), true);
  });

  it("updates a schedule", async () => {
    const addReq = makeRequest("POST", "/api/pri/meeting/schedule/add", {
      meeting_id: meetingId,
      schedule_attr: makeScheduleAttr(),
    });
    const addRes = await routeMeetingSchedule(
      addReq,
      "/api/pri/meeting/schedule/add",
      identityId,
    );
    const addBody = await addRes.json();
    const scheduleId = addBody[0].id as string;

    const req = makeRequest("POST", "/api/pri/meeting/schedule/update", {
      id: scheduleId,
      schedule_attr: { ...makeScheduleAttr(), note: "updated" },
    });
    const res = await routeMeetingSchedule(
      req,
      "/api/pri/meeting/schedule/update",
      identityId,
    );
    assertEquals(res.status, 200);
  });

  it("enables and disables a schedule", async () => {
    const addReq = makeRequest("POST", "/api/pri/meeting/schedule/add", {
      meeting_id: meetingId,
      schedule_attr: makeScheduleAttr(),
    });
    const addRes = await routeMeetingSchedule(
      addReq,
      "/api/pri/meeting/schedule/add",
      identityId,
    );
    const addBody = await addRes.json();
    const scheduleId = addBody[0].id as string;

    const disReq = makeRequest("POST", "/api/pri/meeting/schedule/disable", {
      id: scheduleId,
    });
    const disRes = await routeMeetingSchedule(
      disReq,
      "/api/pri/meeting/schedule/disable",
      identityId,
    );
    assertEquals(disRes.status, 200);
    const disBody = await disRes.json();
    assertEquals(typeof disBody[0].id, "string");

    const enReq = makeRequest("POST", "/api/pri/meeting/schedule/enable", {
      id: scheduleId,
    });
    const enRes = await routeMeetingSchedule(
      enReq,
      "/api/pri/meeting/schedule/enable",
      identityId,
    );
    assertEquals(enRes.status, 200);
    const enBody = await enRes.json();
    assertEquals(typeof enBody[0].id, "string");
  });

  it("resets host key", async () => {
    const addReq = makeRequest("POST", "/api/pri/meeting/schedule/add", {
      meeting_id: meetingId,
      schedule_attr: makeScheduleAttr(),
    });
    const addRes = await routeMeetingSchedule(
      addReq,
      "/api/pri/meeting/schedule/add",
      identityId,
    );
    const addBody = await addRes.json();
    const scheduleId = addBody[0].id as string;

    const req = makeRequest(
      "POST",
      "/api/pri/meeting/schedule/reset/hostkey",
      { id: scheduleId },
    );
    const res = await routeMeetingSchedule(
      req,
      "/api/pri/meeting/schedule/reset/hostkey",
      identityId,
    );
    assertEquals(res.status, 200);
    const body = await res.json();
    assertEquals(Array.isArray(body), true);
    assertEquals(typeof body[0].host_key, "string");
  });

  it("deletes a schedule", async () => {
    const addReq = makeRequest("POST", "/api/pri/meeting/schedule/add", {
      meeting_id: meetingId,
      schedule_attr: makeScheduleAttr(),
    });
    const addRes = await routeMeetingSchedule(
      addReq,
      "/api/pri/meeting/schedule/add",
      identityId,
    );
    const addBody = await addRes.json();
    const scheduleId = addBody[0].id as string;

    const delReq = makeRequest("POST", "/api/pri/meeting/schedule/del", {
      id: scheduleId,
    });
    const delRes = await routeMeetingSchedule(
      delReq,
      "/api/pri/meeting/schedule/del",
      identityId,
    );
    assertEquals(delRes.status, 200);

    const getReq = makeRequest("POST", "/api/pri/meeting/schedule/get", {
      id: scheduleId,
    });
    const getRes = await routeMeetingSchedule(
      getReq,
      "/api/pri/meeting/schedule/get",
      identityId,
    );
    const getBody = await getRes.json();
    assertEquals(getBody.length, 0);
  });

  it("returns 404 for unknown path", async () => {
    const req = makeRequest("POST", "/api/pri/meeting/schedule/unknown", {});
    const res = await routeMeetingSchedule(
      req,
      "/api/pri/meeting/schedule/unknown",
      identityId,
    );
    assertEquals(res.status, 404);
  });

  it("adds a daily schedule", async () => {
    const req = makeRequest("POST", "/api/pri/meeting/schedule/add", {
      meeting_id: meetingId,
      schedule_attr: makeDailyAttr(),
    });
    const res = await routeMeetingSchedule(
      req,
      "/api/pri/meeting/schedule/add",
      identityId,
    );
    assertEquals(res.status, 200);
    const body = await res.json();
    assertEquals(Array.isArray(body), true);
    assertEquals(typeof body[0].id, "string");
  });

  it("adds a weekly schedule", async () => {
    const req = makeRequest("POST", "/api/pri/meeting/schedule/add", {
      meeting_id: meetingId,
      schedule_attr: makeWeeklyAttr(),
    });
    const res = await routeMeetingSchedule(
      req,
      "/api/pri/meeting/schedule/add",
      identityId,
    );
    assertEquals(res.status, 200);
    const body = await res.json();
    assertEquals(Array.isArray(body), true);
    assertEquals(typeof body[0].id, "string");
  });

  it("adds a monthly schedule", async () => {
    const req = makeRequest("POST", "/api/pri/meeting/schedule/add", {
      meeting_id: meetingId,
      schedule_attr: makeMonthlyAttr(),
    });
    const res = await routeMeetingSchedule(
      req,
      "/api/pri/meeting/schedule/add",
      identityId,
    );
    assertEquals(res.status, 200);
    const body = await res.json();
    assertEquals(Array.isArray(body), true);
    assertEquals(typeof body[0].id, "string");
  });

  it("rejects unknown schedule type", async () => {
    const req = makeRequest("POST", "/api/pri/meeting/schedule/add", {
      meeting_id: meetingId,
      schedule_attr: {
        type: "z",
        duration: "60",
        started_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      },
    });
    const res = await routeMeetingSchedule(
      req,
      "/api/pri/meeting/schedule/add",
      identityId,
    );
    assertEquals(res.status, 500);
  });
});
