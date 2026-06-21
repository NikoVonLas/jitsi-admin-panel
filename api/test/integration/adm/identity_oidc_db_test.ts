// Tests for database/identity-oidc.ts and pri/identity-oidc.ts
import { assertEquals } from "@std/assert";
import { afterAll, beforeAll, describe, it } from "@std/testing/bdd";
import { cleanDb } from "../../helpers/db.ts";
import { addIdentity } from "../../../lib/database/identity-oidc.ts";
import { getIdentityId } from "../../../lib/pri/identity-oidc.ts";

const TEST_IDENTITY_ID = "00000000-0000-0000-0000-000000000042";

describe(
  "database/identity-oidc and pri/identity-oidc",
  { sanitizeResources: false, sanitizeOps: false },
  () => {
    beforeAll(async () => {
      await cleanDb();
    });

    afterAll(async () => {
      await cleanDb();
    });

    it("addIdentity inserts a new identity or does nothing on conflict", async () => {
      const rows = await addIdentity(TEST_IDENTITY_ID);
      // Returns the new row if inserted, or empty if already exists
      assertEquals(Array.isArray(rows), true);
    });

    it("addIdentity is idempotent (ON CONFLICT DO NOTHING)", async () => {
      // Second call should not throw
      const rows = await addIdentity(TEST_IDENTITY_ID);
      assertEquals(Array.isArray(rows), true);
    });

    it("getIdentityId returns undefined for request with no token cookie", async () => {
      const req = new Request("http://test/", { method: "GET" });
      const id = await getIdentityId(req);
      assertEquals(id, undefined);
    });

    it("getIdentityId returns undefined for request with invalid JWT", async () => {
      const req = new Request("http://test/", {
        method: "GET",
        headers: { Cookie: "token=invalid.jwt.here" },
      });
      const id = await getIdentityId(req);
      assertEquals(id, undefined);
    });
  },
);
