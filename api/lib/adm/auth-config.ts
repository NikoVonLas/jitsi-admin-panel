import { ok } from "../http/response.ts";
import { AUTH_LOCAL } from "../../config.ts";
import {
  hasEnabledOidcProvider,
  listEnabledOidcProviders,
} from "../database/oidc-provider.ts";
import { hasAnyLocalUser } from "../database/identity-local.ts";

// GET /api/adm/auth/config  (public — no JWT required)
// Returns { local, oidc, setup, oidc_providers }
// setup=true means no users exist yet — show first-user registration form
export default async function handleAuthConfig(): Promise<Response> {
  try {
    const [oidcEnabled, providers, hasUser] = await Promise.all([
      hasEnabledOidcProvider(),
      listEnabledOidcProviders(),
      hasAnyLocalUser(),
    ]);

    return ok(
      JSON.stringify({
        local: AUTH_LOCAL,
        oidc: oidcEnabled,
        setup: AUTH_LOCAL && !hasUser,
        oidc_providers: providers.map((p) => ({ id: p.id, name: p.name })),
      }),
    );
  } catch (e) {
    console.error("getAuthConfig failed:", e);
    return ok(
      JSON.stringify({
        local: AUTH_LOCAL,
        oidc: false,
        setup: false,
        oidc_providers: [],
      }),
    );
  }
}
