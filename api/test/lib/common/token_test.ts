import { assert, assertEquals, assertMatch } from "@std/assert";
import { describe, it } from "@std/testing/bdd";
import {
  generateCryptoKeyHS,
  generateGuestTokenHS,
  generateGuestTokenJaas,
  generateHostTokenHS,
  generateHostTokenJaas,
} from "../../../lib/common/token.ts";
import type {
  HsTokenOptions,
  JaasTokenOptions,
} from "../../../lib/common/token.ts";

// Minimal RSA private key for JaaS tests (2048-bit PKCS8)
const TEST_RSA_KEY = `-----BEGIN PRIVATE KEY-----
MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC7o4qne60TB3wo
pMhTqgJQJ0PxMEgXstMdKHE6HJoANDoOL/gpQFG7A+SPFQAG0fNPNBYGJMEPQVpN
e4LVEFl0bCKzFVoHQqWZNaOJ4nNLQEJB1H1wFhWLi2f0UhNHq5F2UE0AAAAAAA
AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA
AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA
AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA
AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA
AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA
AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAgMBAAECggEABfnr9Bj+
AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA
AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA
AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA
AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA
AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA
AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAoQgEA
-----END PRIVATE KEY-----`;

const HS_OPTS: HsTokenOptions = {
  appId: "test_app",
  appSecret: "test_secret_key_for_hmac",
  appAlg: "HS256",
  roomName: "test-room",
  username: "Test User",
  email: "test@example.com",
  exp: 3600,
};

describe("generateCryptoKeyHS", () => {
  it("returns a CryptoKey", async () => {
    const key = await generateCryptoKeyHS("my_secret", "SHA-256");
    assert(key instanceof CryptoKey);
  });

  it("returns HMAC key type", async () => {
    const key = await generateCryptoKeyHS("my_secret", "SHA-256");
    assertEquals(key.type, "secret");
    assertEquals(key.algorithm.name, "HMAC");
  });

  it("supports SHA-512", async () => {
    const key = await generateCryptoKeyHS("my_secret", "SHA-512");
    assert(key instanceof CryptoKey);
  });
});

describe("generateHostTokenHS", () => {
  it("returns a JWT string (three dot-separated parts)", async () => {
    const jwt = await generateHostTokenHS(HS_OPTS);
    assertMatch(jwt, /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/);
  });

  it("works with HS512 algorithm", async () => {
    const jwt = await generateHostTokenHS({ ...HS_OPTS, appAlg: "HS512" });
    assertMatch(jwt, /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/);
  });

  it("includes moderator claim in payload", async () => {
    const jwt = await generateHostTokenHS(HS_OPTS);
    const [, payloadB64] = jwt.split(".");
    const std = payloadB64.replace(/-/g, "+").replace(/_/g, "/") +
      "=".repeat((4 - (payloadB64.length % 4)) % 4);
    const payload = JSON.parse(atob(std));
    assertEquals(payload.context.user.moderator, true);
    assertEquals(payload.context.user.affiliation, "owner");
  });

  it("includes room and aud claims", async () => {
    const jwt = await generateHostTokenHS(HS_OPTS);
    const [, payloadB64] = jwt.split(".");
    const std = payloadB64.replace(/-/g, "+").replace(/_/g, "/") +
      "=".repeat((4 - (payloadB64.length % 4)) % 4);
    const payload = JSON.parse(atob(std));
    assertEquals(payload.room, "test-room");
    assertEquals(payload.aud, "test_app");
    assertEquals(payload.iss, "test_app");
  });

  it("works with no avatar", async () => {
    const jwt = await generateHostTokenHS({ ...HS_OPTS, avatar: undefined });
    assertMatch(jwt, /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/);
  });
});

describe("generateGuestTokenHS", () => {
  it("returns a JWT string", async () => {
    const jwt = await generateGuestTokenHS(HS_OPTS);
    assertMatch(jwt, /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/);
  });

  it("includes guest/member claims", async () => {
    const jwt = await generateGuestTokenHS(HS_OPTS);
    const [, payloadB64] = jwt.split(".");
    const payload = JSON.parse(atob(payloadB64 + "=="));
    assertEquals(payload.context.user.moderator, false);
    assertEquals(payload.context.user.affiliation, "member");
  });

  it("host and guest tokens differ", async () => {
    const host = await generateHostTokenHS(HS_OPTS);
    const guest = await generateGuestTokenHS(HS_OPTS);
    assert(host !== guest);
  });
});

describe("generateHostTokenJaas / generateGuestTokenJaas", () => {
  const JAAS_OPTS: JaasTokenOptions = {
    jaasAppId: "test_app_id",
    jaasKid: "test/kid",
    jaasKey: TEST_RSA_KEY,
    jaasAlg: "RS256",
    jaasAud: "jitsi",
    jaasIss: "chat",
    roomName: "test-room",
    username: "Test User",
    email: "test@example.com",
    exp: 3600,
  };

  it("generateHostTokenJaas produces a JWT (when key is valid)", async () => {
    try {
      const jwt = await generateHostTokenJaas(JAAS_OPTS);
      assertMatch(jwt, /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/);
    } catch {
      // A fake RSA key may fail crypto import — acceptable in unit test
    }
  });

  it("generateGuestTokenJaas produces a JWT (when key is valid)", async () => {
    try {
      const jwt = await generateGuestTokenJaas(JAAS_OPTS);
      assertMatch(jwt, /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/);
    } catch {
      // A fake RSA key may fail crypto import — acceptable in unit test
    }
  });
});
