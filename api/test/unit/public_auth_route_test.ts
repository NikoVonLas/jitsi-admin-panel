import { assertEquals } from "@std/assert";
import { describe, it } from "@std/testing/bdd";
import { isPublicAuthPostPath } from "../../lib/adm/public-auth-route.ts";

describe("public admin auth routes", () => {
  for (
    const path of [
      "/api/adm/identity/clear",
      "/api/adm/identity/get/bycode",
      "/api/adm/oidc/auth-url",
      "/api/adm/oidc/logout-url",
    ]
  ) {
    it(`allows ${path} before a session exists`, () => {
      assertEquals(isPublicAuthPostPath(path), true);
    });
  }

  it("keeps provider and setting management protected", () => {
    assertEquals(
      isPublicAuthPostPath("/api/adm/oidc-provider/list"),
      false,
    );
    assertEquals(isPublicAuthPostPath("/api/adm/setting/get"), false);
    assertEquals(isPublicAuthPostPath("/api/adm/identity/unknown"), false);
  });
});
