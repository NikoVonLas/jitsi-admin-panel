import { ok } from "../http/response.ts";
import { getLogoutEndpoint, resolveProvider } from "../common/oidc.ts";
import { APP_FQDN, APP_SCHEME } from "../../config.ts";
import { getSettingValue } from "../database/setting.ts";

// -----------------------------------------------------------------------------
export default async function handleOidcLogout(): Promise<Response> {
  const provider = await resolveProvider();
  if (!provider) return ok(JSON.stringify([{ logout_url: "" }]));

  const logoutEndpoint = await getLogoutEndpoint(provider.id);
  if (!logoutEndpoint) return ok(JSON.stringify([{ logout_url: "" }]));

  const scheme = (await getSettingValue("app_scheme")) || APP_SCHEME;
  const fqdn = (await getSettingValue("app_fqdn")) || APP_FQDN;
  const postLogoutRedirectUri = `${scheme}://${fqdn}/oidc/clean`;

  const logoutUrl = `${logoutEndpoint}` +
    `?client_id=${encodeURIComponent(provider.client_id)}` +
    `&post_logout_redirect_uri=${encodeURIComponent(postLogoutRedirectUri)}`;

  return ok(JSON.stringify([{ logout_url: logoutUrl }]));
}
