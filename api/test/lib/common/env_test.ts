import { assertEquals } from "@std/assert";
import { describe, it } from "@std/testing/bdd";
import { parseBoolean } from "../../../lib/common/env.ts";

describe("parseBoolean", () => {
  it("parses explicit values case-insensitively", () => {
    assertEquals(parseBoolean("true", false), true);
    assertEquals(parseBoolean(" TRUE ", false), true);
    assertEquals(parseBoolean("false", true), false);
    assertEquals(parseBoolean("False", true), false);
  });

  it("uses the fallback for missing, empty, or invalid values", () => {
    assertEquals(parseBoolean(undefined, false), false);
    assertEquals(parseBoolean("", true), true);
    assertEquals(parseBoolean("yes", false), false);
    assertEquals(parseBoolean("0", true), true);
  });
});
