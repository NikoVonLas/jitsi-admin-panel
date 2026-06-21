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
import routeMeetingRequest from "../../../lib/pri/meeting-request.ts";

const EMAIL = "admin@meeting-request-test.example";
const PASSWORD = "secure_request_test_pass_123";

async function setupMeeting(identityId: string): Promise<{
  meetingId: string;
  profileId: string;
}> {
  const dReq = makeRequest("POST", "/api/pri/domain/add", {
    name: "Request Test Domain",
    auth_type: "none",
    domain_attr: { url: "https://meet.request-test.example" },
    public: false,
  });
  const dRes = await routeDomain(dReq, "/api/pri/domain/add", identityId);
  const dBody = await dRes.json();
  const domainId = dBody[0].id as string;

  const rReq = makeRequest("POST", "/api/pri/room/add", {
    domain_id: domainId,
    name: "request-room",
    label: "Request Room",
  });
  const rRes = await routeRoom(rReq, "/api/pri/room/add", identityId);
  const rBody = await rRes.json();
  const roomId = rBody[0].id as string;

  const pReq = makeRequest("POST", "/api/pri/profile/list", {
    limit: 5,
    offset: 0,
  });
  const pRes = await routeProfile(pReq, "/api/pri/profile/list", identityId);
  const pBody = await pRes.json();
  const profileId = pBody[0].id as string;

  const mReq = makeRequest("POST", "/api/pri/meeting/add", {
    profile_id: profileId,
    room_id: roomId,
    name: "Request Test Meeting",
    info: "",
    hidden: false,
    subscribable: true,
  });
  const mRes = await routeMeeting(mReq, "/api/pri/meeting/add", identityId);
  const mBody = await mRes.json();
  const meetingId = mBody[0].id as string;

  return { meetingId, profileId };
}

describe("pri/meeting/request", () => {
  let identityId = "";
  let meetingId = "";
  let profileId = "";

  beforeAll(async () => {
    await cleanDb();
    const auth = await registerFirst(EMAIL, PASSWORD);
    identityId = auth.identityId;
    const setup = await setupMeeting(identityId);
    meetingId = setup.meetingId;
    profileId = setup.profileId;
  });

  afterAll(async () => {
    await cleanDb();
  });

  beforeEach(async () => {
    const { query } = await import("../../../lib/database/common.ts");
    // Clean requests and any membership created by the accepts test
    await query({
      text: `DELETE FROM meeting_request WHERE identity_id = $1`,
      args: [identityId],
    });
    await query({
      text: `DELETE FROM meeting_member WHERE identity_id = $1`,
      args: [identityId],
    });
  });

  it("lists requests (empty initially)", async () => {
    const req = makeRequest("POST", "/api/pri/meeting/request/list", {
      limit: 20,
      offset: 0,
    });
    const res = await routeMeetingRequest(
      req,
      "/api/pri/meeting/request/list",
      identityId,
    );
    assertEquals(res.status, 200);
    const body = await res.json();
    assertEquals(Array.isArray(body), true);
    assertEquals(body.length, 0);
  });

  it("adds a meeting request", async () => {
    const req = makeRequest("POST", "/api/pri/meeting/request/add", {
      profile_id: profileId,
      meeting_id: meetingId,
    });
    const res = await routeMeetingRequest(
      req,
      "/api/pri/meeting/request/add",
      identityId,
    );
    assertEquals(res.status, 200);
    const body = await res.json();
    assertEquals(Array.isArray(body), true);
    assertEquals(typeof body[0].id, "string");
  });

  it("gets a request by id", async () => {
    const addReq = makeRequest("POST", "/api/pri/meeting/request/add", {
      profile_id: profileId,
      meeting_id: meetingId,
    });
    const addRes = await routeMeetingRequest(
      addReq,
      "/api/pri/meeting/request/add",
      identityId,
    );
    const addBody = await addRes.json();
    const requestId = addBody[0].id as string;

    const req = makeRequest("POST", "/api/pri/meeting/request/get", {
      id: requestId,
    });
    const res = await routeMeetingRequest(
      req,
      "/api/pri/meeting/request/get",
      identityId,
    );
    assertEquals(res.status, 200);
    const body = await res.json();
    assertEquals(Array.isArray(body), true);
    assertEquals(body[0].id, requestId);
  });

  it("updates a request (change profile)", async () => {
    const addReq = makeRequest("POST", "/api/pri/meeting/request/add", {
      profile_id: profileId,
      meeting_id: meetingId,
    });
    const addRes = await routeMeetingRequest(
      addReq,
      "/api/pri/meeting/request/add",
      identityId,
    );
    const addBody = await addRes.json();
    const requestId = addBody[0].id as string;

    const req = makeRequest("POST", "/api/pri/meeting/request/update", {
      id: requestId,
      profile_id: profileId,
    });
    const res = await routeMeetingRequest(
      req,
      "/api/pri/meeting/request/update",
      identityId,
    );
    assertEquals(res.status, 200);
  });

  it("accepts a request", async () => {
    const addReq = makeRequest("POST", "/api/pri/meeting/request/add", {
      profile_id: profileId,
      meeting_id: meetingId,
    });
    const addRes = await routeMeetingRequest(
      addReq,
      "/api/pri/meeting/request/add",
      identityId,
    );
    const addBody = await addRes.json();
    const requestId = addBody[0].id as string;

    const req = makeRequest("POST", "/api/pri/meeting/request/accept", {
      id: requestId,
    });
    const res = await routeMeetingRequest(
      req,
      "/api/pri/meeting/request/accept",
      identityId,
    );
    assertEquals(res.status, 200);
  });

  it("rejects a request", async () => {
    const addReq = makeRequest("POST", "/api/pri/meeting/request/add", {
      profile_id: profileId,
      meeting_id: meetingId,
    });
    const addRes = await routeMeetingRequest(
      addReq,
      "/api/pri/meeting/request/add",
      identityId,
    );
    const addBody = await addRes.json();
    const requestId = addBody[0].id as string;

    const req = makeRequest("POST", "/api/pri/meeting/request/reject", {
      id: requestId,
    });
    const res = await routeMeetingRequest(
      req,
      "/api/pri/meeting/request/reject",
      identityId,
    );
    assertEquals(res.status, 200);
  });

  it("drops a request", async () => {
    const addReq = makeRequest("POST", "/api/pri/meeting/request/add", {
      profile_id: profileId,
      meeting_id: meetingId,
    });
    const addRes = await routeMeetingRequest(
      addReq,
      "/api/pri/meeting/request/add",
      identityId,
    );
    const addBody = await addRes.json();
    const requestId = addBody[0].id as string;

    const req = makeRequest("POST", "/api/pri/meeting/request/drop", {
      id: requestId,
    });
    const res = await routeMeetingRequest(
      req,
      "/api/pri/meeting/request/drop",
      identityId,
    );
    assertEquals(res.status, 200);
  });

  it("deletes a request", async () => {
    const addReq = makeRequest("POST", "/api/pri/meeting/request/add", {
      profile_id: profileId,
      meeting_id: meetingId,
    });
    const addRes = await routeMeetingRequest(
      addReq,
      "/api/pri/meeting/request/add",
      identityId,
    );
    const addBody = await addRes.json();
    const requestId = addBody[0].id as string;

    const delReq = makeRequest("POST", "/api/pri/meeting/request/del", {
      id: requestId,
    });
    const delRes = await routeMeetingRequest(
      delReq,
      "/api/pri/meeting/request/del",
      identityId,
    );
    assertEquals(delRes.status, 200);

    const getReq = makeRequest("POST", "/api/pri/meeting/request/get", {
      id: requestId,
    });
    const getRes = await routeMeetingRequest(
      getReq,
      "/api/pri/meeting/request/get",
      identityId,
    );
    const getBody = await getRes.json();
    assertEquals(getBody.length, 0);
  });

  it("returns 404 for unknown path", async () => {
    const req = makeRequest("POST", "/api/pri/meeting/request/unknown", {});
    const res = await routeMeetingRequest(
      req,
      "/api/pri/meeting/request/unknown",
      identityId,
    );
    assertEquals(res.status, 404);
  });
});
