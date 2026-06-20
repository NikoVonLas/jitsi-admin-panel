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

const EMAIL = "admin@room-test.example";
const PASSWORD = "secure_room_test_pass_123";

async function addTestDomain(identityId: string): Promise<string> {
  const req = makeRequest("POST", "/api/pri/domain/add", {
    name: "Test Domain For Rooms",
    auth_type: "none",
    domain_attr: { url: "https://meet.room-test.example" },
    public: false,
  });
  const res = await routeDomain(req, "/api/pri/domain/add", identityId);
  const body = await res.json();
  return body[0].id as string;
}

describe("pri/room", () => {
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
      text: `DELETE FROM room WHERE identity_id = $1`,
      args: [identityId],
    });
  });

  it("lists rooms (empty initially)", async () => {
    const req = makeRequest("POST", "/api/pri/room/list", {
      limit: 20,
      offset: 0,
    });
    const res = await routeRoom(req, "/api/pri/room/list", identityId);
    assertEquals(res.status, 200);
    const body = await res.json();
    assertEquals(Array.isArray(body), true);
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

  it("returns 404 for unknown path", async () => {
    const req = makeRequest("POST", "/api/pri/room/unknown", {});
    const res = await routeRoom(req, "/api/pri/room/unknown", identityId);
    assertEquals(res.status, 404);
  });
});
