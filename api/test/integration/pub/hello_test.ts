import { assertEquals } from "@std/assert";
import {
  afterAll,
  beforeAll,
  describe,
  it,
} from "@std/testing/bdd";
import { cleanDb } from "../../helpers/db.ts";
import handlePubHello from "../../../lib/pub/hello.ts";
import handlePriHello from "../../../lib/pri/hello.ts";
import handleAdmHello from "../../../lib/adm/hello.ts";

describe("pub/hello", () => {
  beforeAll(async () => {
    await cleanDb();
  });

  afterAll(async () => {
    await cleanDb();
  });

  it("returns 200", async () => {
    const res = await handlePubHello();
    assertEquals(res.status, 200);
  });

  it("returns lang field", async () => {
    const res = await handlePubHello();
    const body = await res.json();
    assertEquals(typeof body.lang, "string");
  });

  it("returns color and logo fields", async () => {
    const res = await handlePubHello();
    const body = await res.json();
    // These may be null/empty when no settings are configured
    assertEquals("lang" in body, true);
    assertEquals("logo_url" in body, true);
    assertEquals("color_bg_light" in body, true);
  });
});

describe("pri/hello", () => {
  it("returns 200 with identity id in body", () => {
    const res = handlePriHello("test-identity-id");
    assertEquals(res.status, 200);
  });

  it("includes identity id in response text", async () => {
    const res = handlePriHello("my-user-id");
    const body = await res.json();
    assertEquals(body.text, "hello my-user-id");
  });
});

describe("adm/hello", () => {
  it("returns hello admin", async () => {
    const res = handleAdmHello();
    assertEquals(res.status, 200);
    const body = await res.json();
    assertEquals(body.text, "hello admin");
  });
});
