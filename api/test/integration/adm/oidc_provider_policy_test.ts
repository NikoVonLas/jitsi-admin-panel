import { assertRejects } from "@std/assert";
import { afterAll, beforeEach, describe, it } from "@std/testing/bdd";
import { cleanDb } from "../../helpers/db.ts";
import { addOidcProvider } from "../../../lib/database/oidc-provider.ts";
import { ensureOidcProviderRemovalDoesNotLockOut } from "../../../lib/common/oidc-provider-policy.ts";
import { HttpError } from "../../../lib/http/error.ts";

describe(
  "OIDC provider lockout policy",
  { sanitizeResources: false, sanitizeOps: false },
  () => {
    beforeEach(cleanDb);
    afterAll(cleanDb);

    it("rejects removal of the last enabled provider when local auth is off", async () => {
      const [{ id }] = await addOidcProvider(
        "Only provider",
        "https://idp.example",
        "client",
        "secret",
        "openid",
      );
      await assertRejects(
        () => ensureOidcProviderRemovalDoesNotLockOut(id, false),
        HttpError,
        "last enabled OIDC provider",
      );
    });

    it("allows removal when another enabled provider exists", async () => {
      const [{ id }] = await addOidcProvider(
        "First provider",
        "https://idp-a.example",
        "client-a",
        "secret",
        "openid",
      );
      await addOidcProvider(
        "Second provider",
        "https://idp-b.example",
        "client-b",
        "secret",
        "openid",
      );
      await ensureOidcProviderRemovalDoesNotLockOut(id, false);
    });
  },
);
