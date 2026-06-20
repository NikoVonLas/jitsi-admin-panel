import { ok } from "../http/response.ts";
import { getAuthEndpoint, resolveProvider } from "../common/oidc.ts";
import { APP_FQDN, APP_SCHEME } from "../../config.ts";
import { getSettingValue } from "../database/setting.ts";

// -----------------------------------------------------------------------------
export default async function handleOidcAuth(
  req: Request,
): Promise<Response> {
  const body = await req.json();
  const prompt: string = body.prompt ?? "consent";
  const providerId: string | undefined = body.provider_id ?? undefined;

  const provider = await resolveProvider(providerId);
  if (!provider) return ok(JSON.stringify([{ auth_url: "" }]));

  const authEndpoint = await getAuthEndpoint(provider.id);
  if (!authEndpoint) return ok(JSON.stringify([{ auth_url: "" }]));

  const scheme = (await getSettingValue("app_scheme")) || APP_SCHEME;
  const fqdn = (await getSettingValue("app_fqdn")) || APP_FQDN;
  const redirectUri = `${scheme}://${fqdn}/oidc/validate`;

  // Encode provider_id in state so callback knows which provider to use
  const state = encodeURIComponent(
    btoa(JSON.stringify({ next: body.next ?? "/", pid: provider.id })),
  );

  const authUrl = `${authEndpoint}` +
    `?client_id=${encodeURIComponent(provider.client_id)}` +
    `&scope=${encodeURIComponent(provider.scopes)}` +
    `&response_type=code` +
    `&prompt=${prompt}` +
    `&state=${state}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}`;

  return ok(JSON.stringify([{ auth_url: authUrl }]));
}
