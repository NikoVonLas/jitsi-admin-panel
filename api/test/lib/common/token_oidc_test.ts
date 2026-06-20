import { assert, assertMatch } from "@std/assert";
import { describe, it } from "@std/testing/bdd";
import { generateAPIToken } from "../../../lib/common/token-oidc.ts";

describe("generateAPIToken", () => {
  it("returns a JWT string", async () => {
    const token = await generateAPIToken("some-user-id");
    assertMatch(token, /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/);
  });

  it("embeds userId in payload", async () => {
    const userId = "12345-abcde";
    const token = await generateAPIToken(userId);
    const [, payloadB64] = token.split(".");
    // pad base64url to valid base64
    const padded = payloadB64.replace(/-/g, "+").replace(/_/g, "/") +
      "=".repeat((4 - (payloadB64.length % 4)) % 4);
    const payload = JSON.parse(atob(padded));
    assert(payload.userId === userId);
  });

  it("returns different tokens for different users", async () => {
    const t1 = await generateAPIToken("user-1");
    const t2 = await generateAPIToken("user-2");
    const [, p1] = t1.split(".");
    const [, p2] = t2.split(".");
    assert(p1 !== p2);
  });

  it("includes iat and exp claims", async () => {
    const token = await generateAPIToken("user-123");
    const [, payloadB64] = token.split(".");
    const padded = payloadB64.replace(/-/g, "+").replace(/_/g, "/") +
      "=".repeat((4 - (payloadB64.length % 4)) % 4);
    const payload = JSON.parse(atob(padded));
    assert(typeof payload.iat === "number");
    assert(typeof payload.exp === "number");
    assert(payload.exp > payload.iat);
  });
});
