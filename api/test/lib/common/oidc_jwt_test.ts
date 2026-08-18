import { assertEquals, assertRejects } from "@std/assert";
import { describe, it } from "@std/testing/bdd";
import { verifyOidcJwt } from "../../../lib/common/oidc-jwt.ts";
import type { OidcJwk } from "../../../lib/common/oidc-jwt.ts";

const encoder = new TextEncoder();

function base64Url(value: Uint8Array | string): string {
  const bytes = typeof value === "string" ? encoder.encode(value) : value;
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replace(
    /=+$/,
    "",
  );
}

async function fixture() {
  const pair = await crypto.subtle.generateKey(
    {
      name: "RSASSA-PKCS1-v1_5",
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: "SHA-256",
    },
    true,
    ["sign", "verify"],
  );
  const exported = await crypto.subtle.exportKey("jwk", pair.publicKey);
  const jwk: OidcJwk = {
    ...exported,
    kid: "test-key",
    alg: "RS256",
    use: "sig",
  };

  async function sign(payload: Record<string, unknown>): Promise<string> {
    const header = base64Url(
      JSON.stringify({ alg: "RS256", kid: "test-key", typ: "JWT" }),
    );
    const body = base64Url(JSON.stringify(payload));
    const input = `${header}.${body}`;
    const signature = await crypto.subtle.sign(
      "RSASSA-PKCS1-v1_5",
      pair.privateKey,
      encoder.encode(input),
    );
    return `${input}.${base64Url(new Uint8Array(signature))}`;
  }

  return { jwks: { keys: [jwk] }, sign };
}

describe("OIDC JWT validation", () => {
  it("verifies signature and standard ID-token claims", async () => {
    const { jwks, sign } = await fixture();
    const now = 1_700_000_000;
    const token = await sign({
      iss: "https://idp.example/realms/panel",
      sub: "user-1",
      aud: "panel-client",
      exp: now + 300,
      iat: now,
      nonce: "expected-nonce",
    });

    const claims = await verifyOidcJwt(token, jwks, {
      issuer: "https://idp.example/realms/panel",
      audience: "panel-client",
      nonce: "expected-nonce",
      now,
    });

    assertEquals(claims.sub, "user-1");
  });

  it("rejects an invalid nonce", async () => {
    const { jwks, sign } = await fixture();
    const now = 1_700_000_000;
    const token = await sign({
      iss: "https://idp.example",
      sub: "user-1",
      aud: "panel-client",
      exp: now + 300,
      nonce: "wrong",
    });

    await assertRejects(() =>
      verifyOidcJwt(token, jwks, {
        issuer: "https://idp.example",
        audience: "panel-client",
        nonce: "expected",
        now,
      })
    );
  });

  it("rejects tampered claims", async () => {
    const { jwks, sign } = await fixture();
    const now = 1_700_000_000;
    const token = await sign({
      iss: "https://idp.example",
      sub: "user-1",
      aud: "panel-client",
      exp: now + 300,
    });
    const parts = token.split(".");
    parts[1] = base64Url(JSON.stringify({
      iss: "https://idp.example",
      sub: "attacker",
      aud: "panel-client",
      exp: now + 300,
    }));

    await assertRejects(() =>
      verifyOidcJwt(parts.join("."), jwks, {
        issuer: "https://idp.example",
        audience: "panel-client",
        now,
      })
    );
  });

  it("rejects wrong issuer, audience and expiration", async () => {
    const { jwks, sign } = await fixture();
    const now = 1_700_000_000;
    const token = await sign({
      iss: "https://other.example",
      sub: "user-1",
      aud: "other-client",
      exp: now - 120,
    });

    await assertRejects(() =>
      verifyOidcJwt(token, jwks, {
        issuer: "https://idp.example",
        audience: "panel-client",
        now,
      })
    );
  });
});
