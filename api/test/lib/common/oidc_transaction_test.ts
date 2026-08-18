import { assertEquals, assertExists } from "@std/assert";
import { describe, it } from "@std/testing/bdd";
import {
  clearOidcTransaction,
  createOidcTransaction,
  normalizeNextPath,
  readOidcTransaction,
} from "../../../lib/common/oidc-transaction.ts";

function requestWithSetCookie(setCookie: string): Request {
  const cookie = setCookie.split(";")[0];
  return new Request("https://panel.test/api/adm/identity/get/bycode", {
    method: "POST",
    headers: { cookie },
  });
}

describe("OIDC authorization transaction", () => {
  it("keeps only same-origin absolute paths", () => {
    assertEquals(
      normalizeNextPath("/meeting?view=list#today"),
      "/meeting?view=list#today",
    );
    assertEquals(normalizeNextPath("//evil.example/path"), "/");
    assertEquals(normalizeNextPath("/\\evil.example/path"), "/");
    assertEquals(normalizeNextPath("https://evil.example/path"), "/");
    assertEquals(normalizeNextPath("meeting"), "/");
  });

  it("round-trips state, provider, nonce and PKCE verifier", async () => {
    const headers = new Headers();
    const tx = await createOidcTransaction(headers, {
      next: "/meeting",
      providerId: "provider-a",
    }, 1_700_000_000_000);
    const setCookie = headers.get("set-cookie");
    assertExists(setCookie);

    const restored = await readOidcTransaction(
      requestWithSetCookie(setCookie),
      tx.state,
      1_700_000_100_000,
    );

    assertExists(restored);
    assertEquals(restored.next, "/meeting");
    assertEquals(restored.providerId, "provider-a");
    assertEquals(restored.nonce, tx.nonce);
    assertEquals(restored.verifier.length >= 43, true);
    assertEquals(tx.codeChallenge.length >= 43, true);
  });

  it("rejects a mismatched state", async () => {
    const headers = new Headers();
    await createOidcTransaction(headers, {
      next: "/",
      providerId: "provider-a",
    }, 1_700_000_000_000);
    const setCookie = headers.get("set-cookie");
    assertExists(setCookie);

    assertEquals(
      await readOidcTransaction(
        requestWithSetCookie(setCookie),
        "attacker-state",
        1_700_000_100_000,
      ),
      undefined,
    );
  });

  it("rejects a tampered cookie", async () => {
    const headers = new Headers();
    const tx = await createOidcTransaction(headers, {
      next: "/",
      providerId: "provider-a",
    }, 1_700_000_000_000);
    const setCookie = headers.get("set-cookie");
    assertExists(setCookie);
    const cookie = setCookie.split(";")[0];
    const request = new Request("https://panel.test/", {
      headers: { cookie: `${cookie}x` },
    });

    assertEquals(
      await readOidcTransaction(request, tx.state, 1_700_000_100_000),
      undefined,
    );
  });

  it("rejects an expired transaction and emits a deletion cookie", async () => {
    const headers = new Headers();
    const tx = await createOidcTransaction(headers, {
      next: "/",
      providerId: "provider-a",
    }, 1_700_000_000_000);
    const setCookie = headers.get("set-cookie");
    assertExists(setCookie);

    assertEquals(
      await readOidcTransaction(
        requestWithSetCookie(setCookie),
        tx.state,
        1_700_000_700_000,
      ),
      undefined,
    );

    const clearHeaders = new Headers();
    clearOidcTransaction(clearHeaders, tx.state);
    assertEquals(clearHeaders.get("set-cookie")?.includes("Max-Age=0"), true);
  });
});
