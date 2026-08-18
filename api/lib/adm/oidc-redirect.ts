import { APP_FQDN, APP_SCHEME } from "../../config.ts";
import { getOidcDiscovery, resolveProvider } from "../common/oidc.ts";
import { getSettingValue } from "../database/setting.ts";
import { createOidcTransaction } from "../common/oidc-transaction.ts";

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

    const discovery = await getOidcDiscovery(provider.id);
    if (!discovery?.auth) {
      return new Response("OIDC not configured", { status: 503 });
    }

    const scheme = (await getSettingValue("app_scheme")) || APP_SCHEME;
    const fqdn = (await getSettingValue("app_fqdn")) || APP_FQDN;
    const redirectUri = `${scheme}://${fqdn}/oidc/validate`;

    const headers = new Headers();
    const transaction = await createOidcTransaction(headers, {
      next,
      providerId: provider.id,
    });
    const authUrl = new URL(discovery.auth);
    authUrl.searchParams.set("client_id", provider.client_id);
    authUrl.searchParams.set("scope", provider.scopes);
    authUrl.searchParams.set("response_type", "code");
    authUrl.searchParams.set("prompt", prompt);
    authUrl.searchParams.set("state", transaction.state);
    authUrl.searchParams.set("nonce", transaction.nonce);
    authUrl.searchParams.set("code_challenge", transaction.codeChallenge);
    authUrl.searchParams.set("code_challenge_method", "S256");
    authUrl.searchParams.set("redirect_uri", redirectUri);

    headers.set("Location", authUrl.toString());
    return new Response(null, {
      status: 302,
      headers,
    });
  } catch (e) {
    console.error("oidcRedirect error:", e);
    return new Response("Internal error", { status: 500 });
  }
}
