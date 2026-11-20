import { assertEquals } from "@std/assert";
import { afterAll, beforeAll, describe, it } from "@std/testing/bdd";
import { cleanDb, makeRequest } from "../../helpers/db.ts";
import { registerFirst } from "../../helpers/auth.ts";
import routeDomain from "../../../lib/pri/domain.ts";
import routeRoom from "../../../lib/pri/room.ts";
import routeMeeting from "../../../lib/pri/meeting.ts";
import routeProfile from "../../../lib/pri/profile.ts";
import { query } from "../../../lib/database/common.ts";
import { addMeetingSchedule } from "../../../lib/database/meeting-schedule.ts";
import handlePubMeeting from "../../../lib/pub/meeting.ts";

const EMAIL = "admin@pub-meeting-test.example";
const PASSWORD = "secure_pubmeeting_test_pass_123";

describe(
  "pub/meeting",
  { sanitizeResources: false, sanitizeOps: false },
  () => {
    let identityId = "";
    let meetingId = "";
    let domainId = "";
    let roomId = "";

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
      domainId = dBody[0].id as string;

      const rReq = makeRequest("POST", "/api/pri/room/add", {
        domain_id: domainId,
        name: "pub-meeting-room",
        label: "Pub Meeting Room",
      });
      const rRes = await routeRoom(rReq, "/api/pri/room/add", identityId);
      const rBody = await rRes.json();
      roomId = rBody[0].id as string;

      const pReq = makeRequest("POST", "/api/pri/profile/list", {
        limit: 5,
        offset: 0,
      });
      const pRes = await routeProfile(
        pReq,
        "/api/pri/profile/list",
        identityId,
      );
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
      const req = makeRequest("POST", "/api/pub/meeting/get", {
        id: meetingId,
      });
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

    it("issues scheduled participant links on both meeting routes only during enabled sessions", async () => {
      await query({
        text:
          "UPDATE domain SET auth_type='token',domain_attr=domain_attr || $2::jsonb WHERE id=$1",
        args: [domainId, {
          app_id: "test",
          app_alg: "HS256",
          app_secret: "unit-test-signing-key",
        }],
      });
      const { rows } = await query({
        text: "SELECT short_code FROM meeting WHERE id=$1",
        args: [meetingId],
      });
      const pub = "/api/pub/meeting/get/link/byshortcode",
        pri = "/api/pri/meeting/get/link";
      const publicLinks = async () =>
        (await handlePubMeeting(
          makeRequest("POST", pub, {
            short_code: (rows[0] as { short_code: string }).short_code,
          }),
          pub,
        )).json();
      const privateLinks = async () =>
        (await routeMeeting(
          makeRequest("POST", pri, { id: meetingId }),
          pri,
          identityId,
        )).json();
      const verify = async (signed: boolean) => {
        const [a, b] = await Promise.all([publicLinks(), privateLinks()]);
        for (const record of [a[0], b[0]]) {
          assertEquals(new URL(record.url).searchParams.has("jwt"), signed);
        }
        assertEquals(new URL(b[0].moderator_url).searchParams.has("jwt"), true);
      };
      const once = (minutes: number) =>
        addMeetingSchedule(identityId, meetingId, {
          type: "o",
          duration: "30",
          started_at: new Date(Date.now() + minutes * 60000).toISOString(),
        });
      await once(60);
      await verify(false);
      const [active] = await once(-1);
      await query({
        text:
          "UPDATE room SET has_suffix=true,suffix='previous',accessed_at=now()-interval '5 hours' WHERE id=$1",
        args: [roomId],
      });
      const first = new URL((await publicLinks())[0].url);
      const host = new URL((await privateLinks())[0].moderator_url);
      assertEquals(first.pathname, host.pathname);
      await verify(true);
      const roomEndpoint = "/api/pri/room/get/link";
      const roomLink = await routeRoom(
        makeRequest("POST", roomEndpoint, { id: roomId }),
        roomEndpoint,
        identityId,
      );
      assertEquals(
        new URL((await roomLink.json())[0].guest_url).searchParams.has("jwt"),
        false,
      );
      await query({
        text:
          "UPDATE domain SET domain_attr=domain_attr || $2::jsonb WHERE id=$1",
        args: [domainId, { scheduled_guest_start: "false" }],
      });
      await verify(false);
      await query({
        text:
          "UPDATE domain SET domain_attr=domain_attr - 'scheduled_guest_start' WHERE id=$1",
        args: [domainId],
      });
      await query({
        text: "UPDATE meeting_schedule SET enabled=false WHERE id=$1",
        args: [active.id],
      });
      await verify(false);
    });

    it("returns 404 for unknown path", async () => {
      const req = makeRequest("POST", "/api/pub/meeting/unknown", {});
      const res = await handlePubMeeting(req, "/api/pub/meeting/unknown");
      assertEquals(res.status, 404);
    });
  },
);
