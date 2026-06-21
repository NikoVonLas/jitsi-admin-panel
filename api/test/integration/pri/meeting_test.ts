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
