import { assertEquals, assertNotEquals } from "@std/assert";
import { describe, it } from "@std/testing/bdd";
import { createOidcIdentityId } from "../../../lib/common/oidc-identity.ts";

describe("OIDC identity IDs", () => {
  it("is deterministic within one issuer", async () => {
    assertEquals(
      await createOidcIdentityId("https://idp-a.example", "subject-1"),
      await createOidcIdentityId("https://idp-a.example", "subject-1"),
    );
  });

  it("does not collide when two providers issue the same subject", async () => {
    assertNotEquals(
      await createOidcIdentityId("https://idp-a.example", "same-subject"),
      await createOidcIdentityId("https://idp-b.example", "same-subject"),
    );
  });
});
