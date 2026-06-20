import { assertEquals } from "@std/assert";
import { describe, it } from "@std/testing/bdd";
import { adm, pri, pub } from "../../../lib/http/wrapper.ts";

describe("pub wrapper", () => {
  it("returns 200 with serialised result on success", async () => {
    const fn = (_req: Request) => Promise.resolve({ value: 42 });
    const req = new Request("http://test/api/pub/hello");
    const res = await pub(fn, req);
    assertEquals(res.status, 200);
    const body = await res.json();
    assertEquals(body.value, 42);
  });

  it("returns 500 when function throws", async () => {
    const fn = (_req: Request): Promise<unknown> => {
      throw new Error("boom");
    };
    const req = new Request("http://test/api/pub/fail");
    const res = await pub(fn, req);
    assertEquals(res.status, 500);
  });

  it("serialises arrays", async () => {
    const fn = (_req: Request) => Promise.resolve([1, 2, 3]);
    const req = new Request("http://test/api/pub/list");
    const res = await pub(fn, req);
    const body = await res.json();
    assertEquals(body, [1, 2, 3]);
  });
});

describe("pri wrapper", () => {
  it("returns 200 with result on success", async () => {
    const fn = (_req: Request, identityId: string) =>
      Promise.resolve({ id: identityId });
    const req = new Request("http://test/api/pri/test");
    const res = await pri(fn, req, "user-123");
    assertEquals(res.status, 200);
    const body = await res.json();
    assertEquals(body.id, "user-123");
  });

  it("returns 500 when function throws", async () => {
    const fn = (_req: Request, _id: string): Promise<unknown> => {
      throw new Error("db error");
    };
    const req = new Request("http://test/api/pri/fail");
    const res = await pri(fn, req, "user-123");
    assertEquals(res.status, 500);
  });
});

describe("adm wrapper", () => {
  it("delegates to pub wrapper (same behaviour)", async () => {
    const fn = (_req: Request) => Promise.resolve({ admin: true });
    const req = new Request("http://test/api/adm/test");
    const res = await adm(fn, req);
    assertEquals(res.status, 200);
    const body = await res.json();
    assertEquals(body.admin, true);
  });
});
