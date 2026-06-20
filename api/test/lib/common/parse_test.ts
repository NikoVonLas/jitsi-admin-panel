import { assertEquals } from "@std/assert";
import { describe, it } from "@std/testing/bdd";
import { parseEnabledFilter } from "../../../lib/common/parse.ts";

describe("parseEnabledFilter", () => {
  it("returns true for boolean true", () => {
    assertEquals(parseEnabledFilter(true), true);
  });

  it("returns false for boolean false", () => {
    assertEquals(parseEnabledFilter(false), false);
  });

  it("returns null for undefined", () => {
    assertEquals(parseEnabledFilter(undefined), null);
  });

  it("returns null for null", () => {
    assertEquals(parseEnabledFilter(null), null);
  });

  it("returns null for string 'true'", () => {
    assertEquals(parseEnabledFilter("true"), null);
  });

  it("returns null for number 1", () => {
    assertEquals(parseEnabledFilter(1), null);
  });

  it("returns null for number 0", () => {
    assertEquals(parseEnabledFilter(0), null);
  });
});
