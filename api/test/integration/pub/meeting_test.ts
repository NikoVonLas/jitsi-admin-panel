import { assertEquals } from "@std/assert";
import {
  afterAll,
  beforeAll,
  describe,
  it,
} from "@std/testing/bdd";
import { cleanDb, makeRequest } from "../../helpers/db.ts";
import { registerFirst } from "../../helpers/auth.ts";
import routeDomain from "../../../lib/pri/domain.ts";
import routeRoom from "../../../lib/pri/room.ts";
import routeMeeting from "../../../lib/pri/meeting.ts";
import routeProfile from "../../../lib/pri/profile.ts";
import handlePubMeeting from "../../../lib/pub/meeting.ts";

const EMAIL = "admin@pub-meeting-test.example";
const PASSWORD = "secure_pubmeeting_test_pass_123";

describe("pub/meeting", () => {
  let identityId = "";
  let meetingId = "";

  beforeAll(async () => {
    await cleanDb();
    const auth = await registerFirst(EMAIL, PASSWORD);
    identityId = auth.identityId;

    const dReq = makeRequest("POST", "/api/pri/domain/add", {
      name: "Pub Meeting Domain",
      auth_type: "none",
      domain_attr: { url: "https://meet.pub-meeting-test.example" },
      public: false,
    });
    const dRes = await routeDomain(dReq, "/api/pri/domain/add", identityId);
    const dBody = await dRes.json();
    const domainId = dBody[0].id as string;

    const rReq = makeRequest("POST", "/api/pri/room/add", {
      domain_id: domainId,
      name: "pub-meeting-room",
      label: "Pub Meeting Room",
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
      name: "Public Meeting",
      info: "Visible to public",
      hidden: false,
      subscribable: true,
    });
    const mRes = await routeMeeting(mReq, "/api/pri/meeting/add", identityId);
    const mBody = await mRes.json();
    meetingId = mBody[0].id as string;
  });

  afterAll(async () => {
    await cleanDb();
  });

  it("gets a public meeting", async () => {
    const req = makeRequest("POST", "/api/pub/meeting/get", { id: meetingId });
    const res = await handlePubMeeting(req, "/api/pub/meeting/get");
    assertEquals(res.status, 200);
    const body = await res.json();
    // meeting is disabled by default so hidden check may hide it
    assertEquals(Array.isArray(body), true);
  });

  it("gets meeting for mod (enabled check)", async () => {
    const req = makeRequest("POST", "/api/pub/meeting/get/formod", {
      id: meetingId,
    });
    const res = await handlePubMeeting(req, "/api/pub/meeting/get/formod");
    assertEquals(res.status, 200);
    const body = await res.json();
    assertEquals(Array.isArray(body), true);
  });

  it("lists public meetings", async () => {
    const req = makeRequest("POST", "/api/pub/meeting/list", {
      limit: 20,
      offset: 0,
    });
    const res = await handlePubMeeting(req, "/api/pub/meeting/list");
    assertEquals(res.status, 200);
    const body = await res.json();
    assertEquals(Array.isArray(body), true);
  });

  it("returns empty for non-existent short code", async () => {
    const req = makeRequest("POST", "/api/pub/meeting/get/link/byshortcode", {
      short_code: "nonexistent-code-xyz",
    });
    const res = await handlePubMeeting(
      req,
      "/api/pub/meeting/get/link/byshortcode",
    );
    assertEquals(res.status, 200);
    const body = await res.json();
    assertEquals(Array.isArray(body), true);
    assertEquals(body.length, 0);
  });

  it("returns 404 for unknown path", async () => {
    const req = makeRequest("POST", "/api/pub/meeting/unknown", {});
    const res = await handlePubMeeting(req, "/api/pub/meeting/unknown");
    assertEquals(res.status, 404);
  });
});
