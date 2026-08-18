import { assertEquals } from "@std/assert";
import { describe, it } from "@std/testing/bdd";
import {
  clientAddress,
  loginRateLimitKey,
  SlidingWindowRateLimiter,
} from "../../../lib/common/rate-limit.ts";

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

  it("bounds the number of retained client keys", () => {
    const limiter = new SlidingWindowRateLimiter(1, 1_000, 2);
    assertEquals(limiter.take("client-a", 0), true);
    assertEquals(limiter.take("client-b", 0), true);
    assertEquals(limiter.take("client-c", 1), true);
    assertEquals(limiter.take("client-a", 2), true);
  });
});

describe("rate-limit client address", () => {
  it("prefers the proxy-controlled real IP over a spoofed forwarded chain", () => {
    const req = new Request("https://panel.example.com", {
      headers: {
        "x-forwarded-for": "spoofed, 198.51.100.20",
        "x-real-ip": "203.0.113.10",
      },
    });

    assertEquals(clientAddress(req), "203.0.113.10");
    assertEquals(
      loginRateLimitKey(req, "admin@example.com"),
      "203.0.113.10\0admin@example.com",
    );
  });

  it("uses the nearest forwarded address when real IP is absent", () => {
    const req = new Request("https://panel.example.com", {
      headers: { "x-forwarded-for": "spoofed, 198.51.100.20" },
    });

    assertEquals(clientAddress(req), "198.51.100.20");
  });
});
