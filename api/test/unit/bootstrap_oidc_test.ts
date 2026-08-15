import { assertEquals, assertRejects } from "@std/assert";
import { describe, it } from "@std/testing/bdd";
import {
  bootstrapOidcProvider,
  type OidcBootstrapConfig,
} from "../../lib/adm/bootstrap-oidc.ts";

const config: OidcBootstrapConfig = {
  name: "Keycloak",
  issuerUrl: "https://keycloak.example.com/realms/jitsi",
  clientId: "jitsi-admin",
  clientSecret: "secret",
  scopes: "openid profile email",
};

describe("OIDC provider bootstrap", () => {
  it("does nothing when bootstrap env is not configured", async () => {
    let checkedDatabase = false;
    const changed = await bootstrapOidcProvider(
      { ...config, issuerUrl: "", clientId: "" },
      {
        hasProviders: () => {
          checkedDatabase = true;
          return Promise.resolve(false);
        },
        addProvider: () => Promise.resolve(),
      },
    );

    assertEquals(changed, false);
    assertEquals(checkedDatabase, false);
  });

  it("rejects a partially configured provider", async () => {
    await assertRejects(
      () =>
        bootstrapOidcProvider(
          { ...config, clientId: "" },
          {
            hasProviders: () => Promise.resolve(false),
            addProvider: () => Promise.resolve(),
          },
        ),
      Error,
      "OIDC_ISSUER_URL and OIDC_CLIENT_ID must be configured together",
    );
  });

  it("preserves providers already managed in the database", async () => {
    let added = false;
    const changed = await bootstrapOidcProvider(config, {
      hasProviders: () => Promise.resolve(true),
      addProvider: () => {
        added = true;
        return Promise.resolve();
      },
    });

    assertEquals(changed, false);
    assertEquals(added, false);
  });

  it("adds the first provider from environment configuration", async () => {
    let added: OidcBootstrapConfig | undefined;
    const changed = await bootstrapOidcProvider(
      { ...config, name: "", scopes: "" },
      {
        hasProviders: () => Promise.resolve(false),
        addProvider: (provider) => {
          added = provider;
          return Promise.resolve();
        },
      },
    );

    assertEquals(changed, true);
    assertEquals(added, {
      ...config,
      name: "Keycloak",
      scopes: "openid profile email",
    });
  });
});
