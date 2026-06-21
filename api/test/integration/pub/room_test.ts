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
import handlePubRoom from "../../../lib/pub/room.ts";

const EMAIL = "admin@pub-room-test.example";
const PASSWORD = "secure_pubroom_test_pass_123";

describe("pub/room", () => {
  let identityId = "";
  let roomId = "";

  beforeAll(async () => {
    await cleanDb();
    const auth = await registerFirst(EMAIL, PASSWORD);
    identityId = auth.identityId;

    const dReq = makeRequest("POST", "/api/pri/domain/add", {
      name: "Pub Room Domain",
      auth_type: "none",
      domain_attr: { url: "https://meet.pub-room-test.example" },
      public: false,
    });
    const dRes = await routeDomain(dReq, "/api/pri/domain/add", identityId);
    const dBody = await dRes.json();
    const domainId = dBody[0].id as string;

    const rReq = makeRequest("POST", "/api/pri/room/add", {
      domain_id: domainId,
      name: "pub-room",
      label: "Pub Room",
    });
    const rRes = await routeRoom(rReq, "/api/pri/room/add", identityId);
    const rBody = await rRes.json();
    roomId = rBody[0].id as string;
  });

  afterAll(async () => {
    await cleanDb();
  });

  it("gets a public room", async () => {
    const req = makeRequest("POST", "/api/pub/room/get", { id: roomId });
    const res = await handlePubRoom(req, "/api/pub/room/get");
    assertEquals(res.status, 200);
    const body = await res.json();
    assertEquals(Array.isArray(body), true);
  });

  it("returns empty array for join with missing host_key", async () => {
    const req = makeRequest("POST", "/api/pub/room/join/asmod", {
      room_id: roomId,
      host_key: "",
    });
    const res = await handlePubRoom(req, "/api/pub/room/join/asmod");
    assertEquals(res.status, 200);
    const body = await res.json();
    assertEquals(Array.isArray(body), true);
    assertEquals(body.length, 0);
  });

  it("returns empty array for join asmod/byroom with missing host_key", async () => {
    const req = makeRequest("POST", "/api/pub/room/join/asmod/byroom", {
      room_id: roomId,
      host_key: "",
    });
    const res = await handlePubRoom(req, "/api/pub/room/join/asmod/byroom");
    assertEquals(res.status, 200);
    const body = await res.json();
    assertEquals(Array.isArray(body), true);
    assertEquals(body.length, 0);
  });

  it("returns empty array for non-existent short code", async () => {
    const req = makeRequest(
      "POST",
      "/api/pub/room/get/link/byshortcode",
      { short_code: "nonexistent-xyz" },
    );
    const res = await handlePubRoom(req, "/api/pub/room/get/link/byshortcode");
    assertEquals(res.status, 200);
    const body = await res.json();
    assertEquals(Array.isArray(body), true);
    assertEquals(body.length, 0);
  });

  it("returns 404 for unknown path", async () => {
    const req = makeRequest("POST", "/api/pub/room/unknown", {});
    const res = await handlePubRoom(req, "/api/pub/room/unknown");
    assertEquals(res.status, 404);
  });
});
