import { assertEquals } from "@std/assert";
import { describe, it } from "@std/testing/bdd";
import { SlidingWindowRateLimiter } from "../../../lib/common/rate-limit.ts";

describe("SlidingWindowRateLimiter", () => {
  it("blocks after the configured number of attempts", () => {
    const limiter = new SlidingWindowRateLimiter(2, 1_000);
    assertEquals(limiter.take("client", 0), true);
    assertEquals(limiter.take("client", 100), true);
    assertEquals(limiter.take("client", 200), false);
  });

  it("allows attempts after the window and after reset", () => {
    const limiter = new SlidingWindowRateLimiter(1, 1_000);
    assertEquals(limiter.take("client", 0), true);
    assertEquals(limiter.take("client", 500), false);
    assertEquals(limiter.take("client", 1_001), true);
    limiter.reset("client");
    assertEquals(limiter.take("client", 1_002), true);
  });

  it("isolates different keys", () => {
    const limiter = new SlidingWindowRateLimiter(1, 1_000);
    assertEquals(limiter.take("client-a", 0), true);
    assertEquals(limiter.take("client-a", 1), false);
    assertEquals(limiter.take("client-b", 1), true);
  });
});
