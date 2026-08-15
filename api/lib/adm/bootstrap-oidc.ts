import {
  OIDC_CLIENT_ID,
  OIDC_CLIENT_SECRET,
  OIDC_ISSUER_URL,
  OIDC_PROVIDER_NAME,
  OIDC_SCOPES,
} from "../../config.oidc.ts";
import {
  addOidcProvider,
  listOidcProviders,
} from "../database/oidc-provider.ts";

export interface OidcBootstrapConfig {
  name: string;
  issuerUrl: string;
  clientId: string;
  clientSecret: string;
  scopes: string;
}

interface OidcBootstrapDependencies {
  hasProviders: () => Promise<boolean>;
  addProvider: (config: OidcBootstrapConfig) => Promise<void>;
}

const config: OidcBootstrapConfig = {
  name: OIDC_PROVIDER_NAME,
  issuerUrl: OIDC_ISSUER_URL,
  clientId: OIDC_CLIENT_ID,
  clientSecret: OIDC_CLIENT_SECRET,
  scopes: OIDC_SCOPES,
};

const dependencies: OidcBootstrapDependencies = {
  hasProviders: async () => (await listOidcProviders()).length > 0,
  addProvider: async (provider) => {
    await addOidcProvider(
      provider.name,
      provider.issuerUrl,
      provider.clientId,
      provider.clientSecret,
      provider.scopes,
    );
  },
};

export async function bootstrapOidcProvider(
  provider: OidcBootstrapConfig = config,
  deps: OidcBootstrapDependencies = dependencies,
): Promise<boolean> {
  const issuerUrl = provider.issuerUrl.trim();
  const clientId = provider.clientId.trim();

  if (!issuerUrl && !clientId) return false;
  if (!issuerUrl || !clientId) {
    throw new Error(
      "OIDC_ISSUER_URL and OIDC_CLIENT_ID must be configured together",
    );
  }
  if (await deps.hasProviders()) return false;

  await deps.addProvider({
    name: provider.name.trim() || "Keycloak",
    issuerUrl,
    clientId,
    clientSecret: provider.clientSecret.trim(),
    scopes: provider.scopes.trim() || "openid profile email",
  });
  console.log(`Bootstrapped OIDC provider: ${provider.name || "Keycloak"}`);
  return true;
}
