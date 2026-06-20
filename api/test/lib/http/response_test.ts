import { assertEquals } from "@std/assert";
import { describe, it } from "@std/testing/bdd";
import {
  badRequest,
  conflict,
  forbidden,
  internalServerError,
  methodNotAllowed,
  notFound,
  ok,
  unauthorized,
} from "../../../lib/http/response.ts";

describe("ok", () => {
  it("returns 200 status", () => {
    const res = ok('{"data":"test"}');
    assertEquals(res.status, 200);
  });

  it("body matches input string", async () => {
    const res = ok('{"data":"test"}');
    assertEquals(await res.text(), '{"data":"test"}');
  });

  it("accepts custom headers", () => {
    const headers = new Headers({ "Content-Type": "application/json" });
    const res = ok("{}", headers);
    assertEquals(res.status, 200);
    assertEquals(res.headers.get("Content-Type"), "application/json");
  });

  it("works without custom headers", () => {
    const res = ok("hello");
    assertEquals(res.status, 200);
  });
});

describe("notFound", () => {
  it("returns 404 status", () => {
    assertEquals(notFound().status, 404);
  });

  it("body contains error message", async () => {
    const body = await notFound().json();
    assertEquals(body.error.message, "Not Found");
  });
});

describe("unauthorized", () => {
  it("returns 401 status", () => {
    assertEquals(unauthorized().status, 401);
  });

  it("body contains error message", async () => {
    const body = await unauthorized().json();
    assertEquals(body.error.message, "Unauthorized");
  });
});

describe("forbidden", () => {
  it("returns 403 status", () => {
    assertEquals(forbidden().status, 403);
  });

  it("body contains error message", async () => {
    const body = await forbidden().json();
    assertEquals(body.error.message, "Forbidden");
  });
});

describe("badRequest", () => {
  it("returns 400 status", () => {
    assertEquals(badRequest().status, 400);
  });

  it("uses default message", async () => {
    const body = await badRequest().json();
    assertEquals(body.error.message, "Bad Request");
  });

  it("uses custom message", async () => {
    const body = await badRequest("Invalid email").json();
    assertEquals(body.error.message, "Invalid email");
  });
});

describe("conflict", () => {
  it("returns 409 status", () => {
    assertEquals(conflict().status, 409);
  });

  it("body contains error message", async () => {
    const body = await conflict().json();
    assertEquals(body.error.message, "Conflict");
  });
});

describe("methodNotAllowed", () => {
  it("returns 405 status", () => {
    assertEquals(methodNotAllowed().status, 405);
  });

  it("body contains error message", async () => {
    const body = await methodNotAllowed().json();
    assertEquals(body.error.message, "Method Not Allowed");
  });
});

describe("internalServerError", () => {
  it("returns 500 status", () => {
    assertEquals(internalServerError().status, 500);
  });

  it("body contains error message", async () => {
    const body = await internalServerError().json();
    assertEquals(body.error.message, "Internal Server Error");
  });
});
