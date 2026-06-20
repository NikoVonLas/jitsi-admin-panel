import { APP_FQDN, APP_SCHEME } from "../../config.ts";
import { getAuthEndpoint, resolveProvider } from "../common/oidc.ts";
import { getSettingValue } from "../database/setting.ts";

// -----------------------------------------------------------------------------
export default async function handleOidcRedirect(
  req: Request,
): Promise<Response> {
  try {
    const url = new URL(req.url);
    const prompt = url.searchParams.get("prompt") ?? "consent";
    const next = url.searchParams.get("next") ?? "/";
    const providerId = url.searchParams.get("provider_id") ?? undefined;

    const provider = await resolveProvider(providerId);
    if (!provider) {
      return new Response(null, {
        status: 302,
        headers: { "Location": "/login" },
      });
    }

    const authEndpoint = await getAuthEndpoint(provider.id);
    if (!authEndpoint) {
      return new Response("OIDC not configured", { status: 503 });
    }

    const scheme = (await getSettingValue("app_scheme")) || APP_SCHEME;
    const fqdn = (await getSettingValue("app_fqdn")) || APP_FQDN;
    const redirectUri = `${scheme}://${fqdn}/oidc/validate`;

    // Encode provider_id in state so callback knows which provider to use
    const state = encodeURIComponent(
      btoa(JSON.stringify({ next, pid: provider.id })),
    );

    const authUrl = `${authEndpoint}` +
      `?client_id=${encodeURIComponent(provider.client_id)}` +
      `&scope=${encodeURIComponent(provider.scopes)}` +
      `&response_type=code` +
      `&prompt=${prompt}` +
      `&state=${state}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}`;

    return new Response(null, {
      status: 302,
      headers: { "Location": authUrl },
    });
  } catch (e) {
    console.error("oidcRedirect error:", e);
    return new Response("Internal error", { status: 500 });
  }
}
