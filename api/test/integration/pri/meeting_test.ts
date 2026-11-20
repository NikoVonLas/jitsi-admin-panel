import { assertEquals, assertRejects } from "@std/assert";
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

const EMAIL = "admin@meeting-test.example";
const PASSWORD = "secure_meeting_test_pass_123";

async function addTestDomain(identityId: string): Promise<string> {
  const req = makeRequest("POST", "/api/pri/domain/add", {
    name: "Meeting Test Domain",
    auth_type: "none",
    domain_attr: { url: "https://meet.meeting-test.example" },
    public: false,
  });
  const res = await routeDomain(req, "/api/pri/domain/add", identityId);
  const body = await res.json();
  return body[0].id as string;
}

async function addTestRoom(
  identityId: string,
  domainId: string,
): Promise<string> {
  const req = makeRequest("POST", "/api/pri/room/add", {
    domain_id: domainId,
    name: "meeting-test-room",
    label: "Meeting Test Room",
  });
  const res = await routeRoom(req, "/api/pri/room/add", identityId);
  const body = await res.json();
  return body[0].id as string;
}

async function getTestProfile(identityId: string): Promise<string> {
  const req = makeRequest("POST", "/api/pri/profile/list", {
    limit: 5,
    offset: 0,
  });
  const res = await routeProfile(req, "/api/pri/profile/list", identityId);
  const body = await res.json();
  return body[0].id as string;
}

async function addTestMeeting(
  identityId: string,
  profileId: string,
  roomId: string,
  name = "Test Meeting",
): Promise<string> {
  const req = makeRequest("POST", "/api/pri/meeting/add", {
    profile_id: profileId,
    room_id: roomId,
    name,
    info: "Test meeting info",
    hidden: false,
    subscribable: false,
  });
  const res = await routeMeeting(req, "/api/pri/meeting/add", identityId);
  const body = await res.json();
  return body[0].id as string;
}

describe(
  "pri/meeting",
  { sanitizeResources: false, sanitizeOps: false },
  () => {
    let identityId = "";
    let domainId = "";
    let roomId = "";
    let profileId = "";

    beforeAll(async () => {
      await cleanDb();
      const auth = await registerFirst(EMAIL, PASSWORD);
      identityId = auth.identityId;
      domainId = await addTestDomain(identityId);
      roomId = await addTestRoom(identityId, domainId);
      profileId = await getTestProfile(identityId);
    });

    afterAll(async () => {
      await cleanDb();
    });

    beforeEach(async () => {
      const { query } = await import("../../../lib/database/common.ts");
      await query({
        text: `DELETE FROM meeting WHERE identity_id = $1`,
        args: [identityId],
      });
    });

    it("lists meetings (empty initially)", async () => {
      const req = makeRequest("POST", "/api/pri/meeting/list", {
        limit: 20,
        offset: 0,
      });
      const res = await routeMeeting(req, "/api/pri/meeting/list", identityId);
      assertEquals(res.status, 200);
      const body = await res.json();
      assertEquals(Array.isArray(body.items), true);
      assertEquals(typeof body.total, "number");
      assertEquals(body.total, 0);
    });

    it("schedules a moderator's own meeting and withdraws room access on revocation", async () => {
      const { fetch, query } = await import("../../../lib/database/common.ts");
      const { addProfile } = await import("../../../lib/database/profile.ts");
      const { addMeetingSchedule, getMeetingScheduleByMeeting } = await import(
        "../../../lib/database/meeting-schedule.ts"
      );
      const { listSessionForIcal, listSessionByMonth } = await import(
        "../../../lib/database/calendar.ts"
      );
      const { getRoomLinksetByMeetingAndHostKey } = await import(
        "../../../lib/database/room.ts"
      );
      const { getMeetingLinkset, getMeetingLinksetByShortCode } = await import(
        "../../../lib/database/meeting.ts"
      );
      const mod = crypto.randomUUID();
      await query({
        text: "INSERT INTO identity(id) VALUES ($1)",
        args: [mod],
      });
      const profile =
        (await addProfile(mod, "Organizer", "organizer@meeting.test", true))[0]
          .id;
      const endpoint = "/api/pri/meeting/add";
      const payload = {
        profile_id: profile,
        room_id: roomId,
        name: "Shared room meeting",
        info: "",
        hidden: false,
        subscribable: false,
      };
      const create = () =>
        routeMeeting(makeRequest("POST", endpoint, payload), endpoint, mod);
      assertEquals((await create()).status, 403);
      await query({
        text: "INSERT INTO room_partner(room_id,identity_id) VALUES ($1,$2)",
        args: [roomId, mod],
      });
      const added = await create();
      assertEquals(added.status, 200);
      const id = (await added.json())[0].id;
      const own = await fetch({
        text: "SELECT identity_id,short_code FROM meeting WHERE id=$1",
        args: [id],
      }) as { identity_id: string; short_code: string }[];
      assertEquals(own[0].identity_id, mod);
      const start = new Date(Date.now() + 3600000).toISOString();
      const spec = { type: "o", duration: "60", started_at: start };
      const ownerMeeting = await addTestMeeting(identityId, profileId, roomId);
      await assertRejects(
        () => addMeetingSchedule(mod, ownerMeeting, spec),
        Error,
        "Meeting unavailable",
      );
      const schedule = (await addMeetingSchedule(mod, id, spec))[0].id;
      const keys = await fetch({
        text: "SELECT host_key FROM meeting_schedule WHERE id=$1",
        args: [schedule],
      }) as { host_key: string }[];
      const verify = async (expected: number) => {
        assertEquals(
          (await listSessionByMonth(mod, start.slice(0, 10), 50, 0)).length,
          expected,
        );
        assertEquals((await listSessionForIcal(mod, 50, 0)).length, expected);
        assertEquals(
          (await getMeetingScheduleByMeeting(mod, id)).length,
          expected,
        );
        assertEquals((await getMeetingLinkset(mod, id)).length, expected);
        assertEquals(
          (await getMeetingLinksetByShortCode(own[0].short_code)).length,
          expected,
        );
        assertEquals(
          (await getRoomLinksetByMeetingAndHostKey(id, keys[0].host_key))
            .length,
          expected,
        );
      };
      await verify(1);
      await query({
        text: "DELETE FROM room_partner WHERE room_id=$1 AND identity_id=$2",
        args: [roomId, mod],
      });
      await verify(0);
      assertEquals((await create()).status, 403);

      await assertRejects(() => addMeetingSchedule(mod, id, spec));
      await query({ text: "DELETE FROM identity WHERE id=$1", args: [mod] });
    });

    it("saves all schedules atomically and recognizes concurrent retries", async () => {
      const { query } = await import("../../../lib/database/common.ts");
      const request_id = crypto.randomUUID();
      const schedule = {
        type: "o",
        duration: "30",
        started_at: new Date(Date.now() + 86400000).toISOString(),
      };
      const path = "/api/pri/meeting/add";
      const save = (schedules: unknown[]) =>
        routeMeeting(
          makeRequest("POST", path, {
            request_id,
            room_id: roomId,
            profile_id: profileId,
            name: "Atomic meeting",
            info: "",
            hidden: true,
            subscribable: false,
            schedules,
          }),
          path,
          identityId,
        );
      // The second rule passes field validation but selects no date in its one-day window.
      const day = schedule.started_at.slice(0, 10);
      const excluded = new Date(schedule.started_at).getUTCDay();
      const mask = Array.from(
        { length: 7 },
        (_, i) => i === (excluded + 1) % 7 ? "1" : "0",
      ).join("");
      assertEquals(
        (await save([schedule, {
          ...schedule,
          type: "w",
          rep_every: "1",
          timezone_offset: "0",
          rep_end_type: "at",
          rep_end_at: day + "T23:59:59.999Z",
          rep_days: mask,
        }])).status,
        400,
      );
      assertEquals(
        (await query({
          text: "SELECT id FROM meeting WHERE name='Atomic meeting'",
        })).rows.length,
        0,
      );
      const attempts = await Promise.all([
        save([schedule, schedule]),
        save([schedule, schedule]),
      ]);
      for (const response of attempts) {
        assertEquals(response.status, 200);
        assertEquals((await response.json())[0].id, request_id);
      }
      const stored = await query({
        text:
          "SELECT DISTINCT s.id FROM meeting_schedule s JOIN meeting_session ses ON ses.meeting_schedule_id=s.id JOIN meeting m ON s.meeting_id=m.id WHERE m.name='Atomic meeting'",
      });
      assertEquals(stored.rows.length, 2);
    });

    it("adds a new meeting", async () => {
      const req = makeRequest("POST", "/api/pri/meeting/add", {
        profile_id: profileId,
        room_id: roomId,
        name: "My Meeting",
        info: "Meeting info",
        hidden: false,
        subscribable: false,
      });
      const res = await routeMeeting(req, "/api/pri/meeting/add", identityId);
      assertEquals(res.status, 200);
      const body = await res.json();
      assertEquals(Array.isArray(body), true);
      assertEquals(typeof body[0].id, "string");
    });

    it("gets a meeting by id", async () => {
      const meetingId = await addTestMeeting(
        identityId,
        profileId,
        roomId,
        "Get Test",
      );

      const req = makeRequest("POST", "/api/pri/meeting/get", {
        id: meetingId,
      });
      const res = await routeMeeting(req, "/api/pri/meeting/get", identityId);
      assertEquals(res.status, 200);
      const body = await res.json();
      assertEquals(Array.isArray(body), true);
      assertEquals(body[0].id, meetingId);
      assertEquals(body[0].name, "Get Test");
    });

    it("returns empty array for non-existent meeting", async () => {
      const req = makeRequest("POST", "/api/pri/meeting/get", {
        id: "00000000-0000-0000-0000-000000000099",
      });
      const res = await routeMeeting(req, "/api/pri/meeting/get", identityId);
      assertEquals(res.status, 200);
      const body = await res.json();
      assertEquals(Array.isArray(body), true);
      assertEquals(body.length, 0);
    });

    it("updates a meeting", async () => {
      const meetingId = await addTestMeeting(
        identityId,
        profileId,
        roomId,
        "Before Update",
      );

      const req = makeRequest("POST", "/api/pri/meeting/update", {
        id: meetingId,
        profile_id: profileId,
        room_id: roomId,
        name: "After Update",
        info: "Updated info",
        hidden: true,
        subscribable: false,
      });
      const res = await routeMeeting(
        req,
        "/api/pri/meeting/update",
        identityId,
      );
      assertEquals(res.status, 200);
      const body = await res.json();
      assertEquals(Array.isArray(body), true);
    });

    it("enables a meeting", async () => {
      const meetingId = await addTestMeeting(
        identityId,
        profileId,
        roomId,
        "Enable Test",
      );

      const req = makeRequest("POST", "/api/pri/meeting/enable", {
        id: meetingId,
      });
      const res = await routeMeeting(
        req,
        "/api/pri/meeting/enable",
        identityId,
      );
      assertEquals(res.status, 200);
      const body = await res.json();
      assertEquals(Array.isArray(body), true);
      assertEquals(typeof body[0].id, "string");
    });

    it("disables a meeting", async () => {
      const meetingId = await addTestMeeting(
        identityId,
        profileId,
        roomId,
        "Disable Test",
      );

      const req = makeRequest("POST", "/api/pri/meeting/disable", {
        id: meetingId,
      });
      const res = await routeMeeting(
        req,
        "/api/pri/meeting/disable",
        identityId,
      );
      assertEquals(res.status, 200);
      const body = await res.json();
      assertEquals(Array.isArray(body), true);
      assertEquals(typeof body[0].id, "string");
    });

    it("deletes a meeting", async () => {
      const meetingId = await addTestMeeting(
        identityId,
        profileId,
        roomId,
        "Delete Test",
      );

      const delReq = makeRequest("POST", "/api/pri/meeting/del", {
        id: meetingId,
      });
      const delRes = await routeMeeting(
        delReq,
        "/api/pri/meeting/del",
        identityId,
      );
      assertEquals(delRes.status, 200);

      const getReq = makeRequest("POST", "/api/pri/meeting/get", {
        id: meetingId,
      });
      const getRes = await routeMeeting(
        getReq,
        "/api/pri/meeting/get",
        identityId,
      );
      const getBody = await getRes.json();
      assertEquals(getBody.length, 0);
    });

    it("gets meeting as card", async () => {
      const meetingId = await addTestMeeting(
        identityId,
        profileId,
        roomId,
        "Card Test",
      );

      const req = makeRequest("POST", "/api/pri/meeting/get/ascard", {
        id: meetingId,
      });
      const res = await routeMeeting(
        req,
        "/api/pri/meeting/get/ascard",
        identityId,
      );
      assertEquals(res.status, 200);
    });

    it("lists meetings filtered by room_id", async () => {
      await addTestMeeting(identityId, profileId, roomId, "Filter Test");

      const req = makeRequest("POST", "/api/pri/meeting/list", {
        limit: 20,
        offset: 0,
        room_id: roomId,
      });
      const res = await routeMeeting(req, "/api/pri/meeting/list", identityId);
      assertEquals(res.status, 200);
      const body = await res.json();
      assertEquals(body.items.length >= 1, true);
    });

    it("getLink returns empty for non-existent meeting", async () => {
      const req = makeRequest("POST", "/api/pri/meeting/get/link", {
        id: "00000000-0000-0000-0000-000000000099",
      });
      const res = await routeMeeting(
        req,
        "/api/pri/meeting/get/link",
        identityId,
      );
      assertEquals(res.status, 200);
      const body = await res.json();
      assertEquals(body, []);
    });

    it("returns 404 for unknown path", async () => {
      const req = makeRequest("POST", "/api/pri/meeting/unknown", {});
      const res = await routeMeeting(
        req,
        "/api/pri/meeting/unknown",
        identityId,
      );
      assertEquals(res.status, 404);
    });
  },
);
