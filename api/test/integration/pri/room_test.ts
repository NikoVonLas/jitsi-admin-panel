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
import { getRoomIdByName } from "../../../lib/database/room.ts";

const EMAIL = "admin@room-test.example";
const PASSWORD = "secure_room_test_pass_123";

const OTHER_OWNER_ID = "10000000-0000-0000-0000-0000000000b0";

async function addTestDomain(
  identityId: string,
  name = "Test Domain For Rooms",
  url = "https://meet.room-test.example",
  isPublic = false,
): Promise<string> {
  const req = makeRequest("POST", "/api/pri/domain/add", {
    name,
    auth_type: "none",
    domain_attr: { url },
    public: isPublic,
  });
  const res = await routeDomain(req, "/api/pri/domain/add", identityId);
  const body = await res.json();
  return body[0].id as string;
}

describe("pri/room", { sanitizeResources: false, sanitizeOps: false }, () => {
  let identityId = "";
  let domainId = "";

  beforeAll(async () => {
    await cleanDb();
    const auth = await registerFirst(EMAIL, PASSWORD);
    identityId = auth.identityId;
    domainId = await addTestDomain(identityId);
  });

  afterAll(async () => {
    await cleanDb();
  });

  beforeEach(async () => {
    const { query } = await import("../../../lib/database/common.ts");
    await query({
      text: `DELETE FROM room WHERE identity_id = ANY($1::uuid[])`,
      args: [[identityId, OTHER_OWNER_ID]],
    });
  });

  async function addRoomAs(
    owner: string,
    name: string,
    domain = domainId,
  ): Promise<Response> {
    const req = makeRequest("POST", "/api/pri/room/add", {
      domain_id: domain,
      name,
      label: name,
    });
    return await routeRoom(req, "/api/pri/room/add", owner);
  }

  async function renameRoomAs(
    owner: string,
    id: string,
    name: string,
  ): Promise<Response> {
    const req = makeRequest("POST", "/api/pri/room/update", {
      id,
      domain_id: domainId,
      name,
      label: name,
    });
    return await routeRoom(req, "/api/pri/room/update", owner);
  }

  it("lists rooms (empty initially)", async () => {
    const req = makeRequest("POST", "/api/pri/room/list", {
      limit: 20,
      offset: 0,
    });
    const res = await routeRoom(req, "/api/pri/room/list", identityId);
    assertEquals(res.status, 200);
    const body = await res.json();
    // listRoom returns { items: [...], total: N }
    assertEquals(Array.isArray(body.items), true);
    assertEquals(typeof body.total, "number");
  });

  it("adds a new room", async () => {
    const req = makeRequest("POST", "/api/pri/room/add", {
      domain_id: domainId,
      name: "test-room",
      label: "Test Room",
    });
    const res = await routeRoom(req, "/api/pri/room/add", identityId);
    assertEquals(res.status, 200);
    const body = await res.json();
    assertEquals(Array.isArray(body), true);
    assertEquals(body[0].id !== undefined, true);
  });

  it("gets a room by id", async () => {
    const addReq = makeRequest("POST", "/api/pri/room/add", {
      domain_id: domainId,
      name: "get-room",
      label: "Get Room",
    });
    const addRes = await routeRoom(addReq, "/api/pri/room/add", identityId);
    const roomId = (await addRes.json())[0].id;

    const getReq = makeRequest("POST", "/api/pri/room/get", { id: roomId });
    const getRes = await routeRoom(getReq, "/api/pri/room/get", identityId);
    assertEquals(getRes.status, 200);
    const getBody = await getRes.json();
    assertEquals(Array.isArray(getBody), true);
  });

  it("gets room host key", async () => {
    const addReq = makeRequest("POST", "/api/pri/room/add", {
      domain_id: domainId,
      name: "hostkey-room",
      label: "Host Key Room",
    });
    const addRes = await routeRoom(addReq, "/api/pri/room/add", identityId);
    const roomId = (await addRes.json())[0].id;

    const keyReq = makeRequest("POST", "/api/pri/room/get/hostkey", {
      id: roomId,
    });
    const keyRes = await routeRoom(
      keyReq,
      "/api/pri/room/get/hostkey",
      identityId,
    );
    assertEquals(keyRes.status, 200);
  });

  it("enables and disables a room", async () => {
    const addReq = makeRequest("POST", "/api/pri/room/add", {
      domain_id: domainId,
      name: "toggle-room",
      label: "Toggle Room",
    });
    const addRes = await routeRoom(addReq, "/api/pri/room/add", identityId);
    const id = (await addRes.json())[0].id;

    const disRes = await routeRoom(
      makeRequest("POST", "/api/pri/room/disable", { id }),
      "/api/pri/room/disable",
      identityId,
    );
    assertEquals(disRes.status, 200);

    const enRes = await routeRoom(
      makeRequest("POST", "/api/pri/room/enable", { id }),
      "/api/pri/room/enable",
      identityId,
    );
    assertEquals(enRes.status, 200);
  });

  it("updates a room", async () => {
    const addReq = makeRequest("POST", "/api/pri/room/add", {
      domain_id: domainId,
      name: "update-room",
      label: "Update Room",
    });
    const addRes = await routeRoom(addReq, "/api/pri/room/add", identityId);
    const id = (await addRes.json())[0].id;

    const updateReq = makeRequest("POST", "/api/pri/room/update", {
      id,
      domain_id: domainId,
      name: "updated-room",
      label: "Updated Room",
    });
    const updateRes = await routeRoom(
      updateReq,
      "/api/pri/room/update",
      identityId,
    );
    assertEquals(updateRes.status, 200);
  });

  it("deletes a room", async () => {
    const addReq = makeRequest("POST", "/api/pri/room/add", {
      domain_id: domainId,
      name: "delete-room",
      label: "Delete Room",
    });
    const addRes = await routeRoom(addReq, "/api/pri/room/add", identityId);
    const id = (await addRes.json())[0].id;

    const delRes = await routeRoom(
      makeRequest("POST", "/api/pri/room/del", { id }),
      "/api/pri/room/del",
      identityId,
    );
    assertEquals(delRes.status, 200);
  });

  it("resets room host key", async () => {
    const addReq = makeRequest("POST", "/api/pri/room/add", {
      domain_id: domainId,
      name: "reset-key-room",
      label: "Reset Key Room",
    });
    const addRes = await routeRoom(addReq, "/api/pri/room/add", identityId);
    const id = (await addRes.json())[0].id;

    const resetRes = await routeRoom(
      makeRequest("POST", "/api/pri/room/reset/hostkey", { id }),
      "/api/pri/room/reset/hostkey",
      identityId,
    );
    assertEquals(resetRes.status, 200);
    const body = await resetRes.json();
    assertEquals(Array.isArray(body), true);
  });

  it("gets room link (returns empty if room disabled or no public domain)", async () => {
    const addReq = makeRequest("POST", "/api/pri/room/add", {
      domain_id: domainId,
      name: "link-room",
      label: "Link Room",
    });
    const addRes = await routeRoom(addReq, "/api/pri/room/add", identityId);
    const id = (await addRes.json())[0].id;

    const linkRes = await routeRoom(
      makeRequest("POST", "/api/pri/room/get/link", { id }),
      "/api/pri/room/get/link",
      identityId,
    );
    assertEquals(linkRes.status, 200);
    const body = await linkRes.json();
    assertEquals(Array.isArray(body), true);
  });

  it("gets room link by name (returns empty for unknown room)", async () => {
    const linkRes = await routeRoom(
      makeRequest("POST", "/api/pri/room/get/link/byname", {
        room_name: "nonexistent-room-xyz",
        domain_url: "https://meet.room-test.example",
      }),
      "/api/pri/room/get/link/byname",
      identityId,
    );
    assertEquals(linkRes.status, 200);
    const body = await linkRes.json();
    assertEquals(Array.isArray(body), true);
    assertEquals(body.length, 0);
  });

  it("finds a room by the conference name Jitsi uses", async () => {
    // The lookup answers only for public domains and the caller's own ones.
    const publicDomainId = await addTestDomain(
      identityId,
      "Public Domain For Rooms",
      "https://public.room-test.example",
      true,
    );
    const added = await addRoomAs(identityId, "ＫＩＴ", publicDomainId);
    const id = (await added.json())[0].id;

    const rows = await getRoomIdByName(
      identityId,
      "https://public.room-test.example",
      "kit",
    );
    assertEquals(rows.map((row) => row.id), [id]);
  });

  it("gets room link by name returns empty for empty room_name", async () => {
    const linkRes = await routeRoom(
      makeRequest("POST", "/api/pri/room/get/link/byname", {
        room_name: "",
        domain_url: "",
      }),
      "/api/pri/room/get/link/byname",
      identityId,
    );
    assertEquals(linkRes.status, 200);
    const body = await linkRes.json();
    assertEquals(body, []);
  });

  it("lets the owner and superadmin manage room-scoped moderator access", async () => {
    const { query } = await import("../../../lib/database/common.ts");
    const { addProfile } = await import("../../../lib/database/profile.ts");
    const owner = crypto.randomUUID();
    const moderator = crypto.randomUUID();
    const email = "moderator@room.example";
    await query({
      text: `INSERT INTO identity (id, identity_attr) VALUES
        ($1, '{"email":"owner@room.example"}'), ($2, jsonb_build_object('email', $3::text))`,
      args: [owner, moderator, email],
    });
    await addProfile(moderator, "Moderator", email, true);
    await query({
      text: `UPDATE domain SET auth_type = 'token',
        domain_attr = domain_attr || jsonb_build_object('app_id','panel-test','app_alg','HS256','app_secret',$2::text)
        WHERE id = $1`,
      args: [domainId, crypto.randomUUID()],
    });
    const roomId = crypto.randomUUID();
    await query({
      text:
        "INSERT INTO room (id, identity_id, domain_id, name) VALUES ($1,$2,$3,'shared-KIT')",
      args: [roomId, owner, domainId],
    });
    async function call(
      actor: string,
      route: string,
      payload: Record<string, unknown> = {},
    ) {
      const path = "/api/pri/room/" + route;
      return await routeRoom(
        makeRequest("POST", path, { id: roomId, ...payload }),
        path,
        actor,
      );
    }
    await addProfile(owner, "Owner", "owner@room.example", true);
    await query({
      text:
        "INSERT INTO domain_member(domain_id,email) VALUES ($1,'owner@room.example')",
      args: [domainId],
    });
    assertEquals((await (await call(owner, "get/link")).json()).length, 1);
    const byName = {
      room_name: "shared-kit",
      domain_url: "https://meet.room-test.example",
    };
    assertEquals(
      await (await call(moderator, "get/link/byname", byName)).json(),
      [],
    );
    assertEquals(
      (await call(moderator, "moderators/add", { email })).status,
      404,
    );
    assertEquals((await call(moderator, "moderators/list")).status, 404);
    assertEquals(
      (await call(owner, "moderators/add", { email: "" })).status,
      400,
    );
    assertEquals(
      (await call(owner, "moderators/remove", { identity_id: "invalid" }))
        .status,
      400,
    );
    assertEquals(
      (await call(owner, "moderators/add", { email: "absent@room.example" }))
        .status,
      404,
    );
    for (const manager of [owner, identityId]) {
      assertEquals(
        (await call(manager, "moderators/add", { email })).status,
        200,
      );
      assertEquals(
        (await call(manager, "moderators/add", { email })).status,
        200,
      );
      const members = await (await call(manager, "moderators/list")).json();
      assertEquals(members.map((m: { id: string }) => m.id), [moderator]);
      for (
        const [route, payload] of [["get/link", {}], [
          "get/link/byname",
          byName,
        ]] as const
      ) {
        const links = await (await call(moderator, route, payload)).json();
        const url = new URL(links[0].url);
        assertEquals(url.pathname, "/shared-KIT");
        const encoded = url.searchParams.get("jwt")!.split(".")[1];
        const claims = JSON.parse(
          atob(encoded.replaceAll("-", "+").replaceAll("_", "/")),
        );
        assertEquals(claims.room, "shared-kit");
        assertEquals(claims.context.user.moderator, true);
        assertEquals(claims.context.user.email, email);
      }
      const shared =
        await (await call(moderator, "list", { include_shared: true })).json();
      assertEquals(shared.total, 1);
      assertEquals(shared.items[0].shared, true);
      assertEquals((await (await call(moderator, "list")).json()).total, 0);
      for (const route of ["del", "disable", "get/hostkey", "reset/hostkey"]) {
        assertEquals(await (await call(moderator, route)).json(), []);
      }
      assertEquals(
        (await call(moderator, "moderators/remove", { identity_id: moderator }))
          .status,
        404,
      );
      assertEquals(
        (await call(manager, "moderators/remove", { identity_id: moderator }))
          .status,
        200,
      );
      assertEquals(await (await call(moderator, "get/link")).json(), []);
      assertEquals(
        await (await call(moderator, "get/link/byname", byName)).json(),
        [],
      );
    }
    // A partnership created by an older installation grants exactly the same access.
    await query({
      text: "INSERT INTO room_partner (identity_id,room_id) VALUES ($1,$2)",
      args: [moderator, roomId],
    });
    assertEquals((await (await call(moderator, "get/link")).json()).length, 1);
    await call(owner, "disable");
    assertEquals(await (await call(moderator, "get/link")).json(), []);
  });

  describe("room name within a domain", () => {
    beforeAll(async () => {
      const { query } = await import("../../../lib/database/common.ts");
      await query({
        text: `INSERT INTO identity (id, is_superadmin) VALUES ($1, true)`,
        args: [OTHER_OWNER_ID],
      });
    });

    it("refuses a name another owner holds, whatever the letter case", async () => {
      assertEquals((await addRoomAs(identityId, "KIT")).status, 200);

      const res = await addRoomAs(OTHER_OWNER_ID, "kit");
      assertEquals(res.status, 409);
      assertEquals((await res.json()).error.code, "room_name_taken");
    });

    it("refuses a name that differs only by Unicode compatibility form", async () => {
      assertEquals((await addRoomAs(identityId, "KIT")).status, 200);

      const res = await addRoomAs(OTHER_OWNER_ID, "ＫＩＴ");
      assertEquals(res.status, 409);
      assertEquals((await res.json()).error.code, "room_name_taken");
    });

    it("refuses renaming a room into a taken name", async () => {
      assertEquals((await addRoomAs(identityId, "Комитет")).status, 200);
      const added = await addRoomAs(OTHER_OWNER_ID, "other-room");
      const id = (await added.json())[0].id;

      const res = await renameRoomAs(OTHER_OWNER_ID, id, "КОМИТЕТ");
      assertEquals(res.status, 409);
      assertEquals((await res.json()).error.code, "room_name_taken");
    });

    it("lets an owner change the letter case of their own room name", async () => {
      const added = await addRoomAs(identityId, "kit");
      const id = (await added.json())[0].id;

      assertEquals((await renameRoomAs(identityId, id, "KIT")).status, 200);
    });

    it("allows the same name in another domain", async () => {
      const otherDomainId = await addTestDomain(
        identityId,
        "Second Domain For Rooms",
        "https://meet2.room-test.example",
      );
      assertEquals((await addRoomAs(identityId, "KIT")).status, 200);

      const res = await addRoomAs(OTHER_OWNER_ID, "KIT", otherDomainId);
      assertEquals(res.status, 200);
    });
  });

  it("returns 404 for unknown path", async () => {
    const req = makeRequest("POST", "/api/pri/room/unknown", {});
    const res = await routeRoom(req, "/api/pri/room/unknown", identityId);
    assertEquals(res.status, 404);
  });
});
