import { assertEquals, assertThrows } from "@std/assert";
import { describe, it } from "@std/testing/bdd";
import {
  checkAttr,
  getLimit,
  getOffset,
} from "../../../lib/database/common.ts";

describe("getLimit", () => {
  it("returns DEFAULT_LIST_SIZE when 0 is passed", () => {
    const result = getLimit(0);
    assertEquals(result, 20); // DEFAULT_LIST_SIZE default
  });

  it("returns the value when within bounds", () => {
    assertEquals(getLimit(50), 50);
  });

  it("clamps to MAX_LIST_SIZE when exceeded", () => {
    const result = getLimit(9999999);
    assertEquals(result, 2000); // MAX_LIST_SIZE default
  });

  it("returns default for NaN (falsy)", () => {
    const result = getLimit(NaN);
    assertEquals(result, 20);
  });
});

describe("getOffset", () => {
  it("returns 0 when falsy value passed", () => {
    assertEquals(getOffset(0), 0);
    assertEquals(getOffset(NaN), 0);
  });

  it("returns the value when truthy", () => {
    assertEquals(getOffset(100), 100);
  });
});

describe("checkAttr", () => {
  it("passes for empty object", () => {
    checkAttr({});
  });

  it("passes when all values are strings", () => {
    checkAttr({ url: "https://example.com", app_id: "test" });
  });

  it("throws when a value is a number", () => {
    assertThrows(() => checkAttr({ port: 8080 as unknown as string }), Error);
  });

  it("throws when a value is boolean", () => {
    assertThrows(
      () => checkAttr({ enabled: true as unknown as string }),
      Error,
    );
  });

  it("throws when a value is null", () => {
    assertThrows(
      () => checkAttr({ val: null as unknown as string }),
      Error,
    );
  });
});
