import { ok } from "../http/response.ts";
import { getOidcDiscovery, resolveProvider } from "../common/oidc.ts";
import { APP_FQDN, APP_SCHEME } from "../../config.ts";
import { getSettingValue } from "../database/setting.ts";
import { createOidcTransaction } from "../common/oidc-transaction.ts";

// -----------------------------------------------------------------------------
export default async function handleOidcAuth(
  req: Request,
): Promise<Response> {
  const body = await req.json();
  const prompt: string = body.prompt ?? "consent";
  const providerId: string | undefined = body.provider_id ?? undefined;

  const provider = await resolveProvider(providerId);
  if (!provider) return ok(JSON.stringify([{ auth_url: "" }]));

  const discovery = await getOidcDiscovery(provider.id);
  if (!discovery?.auth) return ok(JSON.stringify([{ auth_url: "" }]));

  const scheme = (await getSettingValue("app_scheme")) || APP_SCHEME;
  const fqdn = (await getSettingValue("app_fqdn")) || APP_FQDN;
  const redirectUri = `${scheme}://${fqdn}/oidc/validate`;

  const headers = new Headers();
  const transaction = await createOidcTransaction(headers, {
    next: body.next ?? "/",
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

  return ok(JSON.stringify([{ auth_url: authUrl.toString() }]), headers);
}
