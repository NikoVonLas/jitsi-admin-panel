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

const SCHEDULE_ATTR = {
  type: "weekly",
  weekday: 1,
  hour: 10,
  minute: 0,
  duration: 60,
};

describe("pri/meeting/schedule", () => {
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
      schedule_attr: SCHEDULE_ATTR,
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
      schedule_attr: SCHEDULE_ATTR,
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
      schedule_attr: SCHEDULE_ATTR,
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
      schedule_attr: SCHEDULE_ATTR,
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
      schedule_attr: { ...SCHEDULE_ATTR, hour: 14 },
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
      schedule_attr: SCHEDULE_ATTR,
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
    assertEquals(disBody[0].enabled, false);

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
    assertEquals(enBody[0].enabled, true);
  });

  it("resets host key", async () => {
    const addReq = makeRequest("POST", "/api/pri/meeting/schedule/add", {
      meeting_id: meetingId,
      schedule_attr: SCHEDULE_ATTR,
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
      schedule_attr: SCHEDULE_ATTR,
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
});
