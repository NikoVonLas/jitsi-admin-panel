import { badRequest, notFound } from "../http/response.ts";
import { adm as wrapper } from "../http/wrapper.ts";
import {
  addOidcProvider,
  deleteOidcProvider,
  listOidcProviders,
  toggleOidcProvider,
  updateOidcProvider,
} from "../database/oidc-provider.ts";

const PRE = "/api/adm/oidc-provider";

// Strip client_secret from list response
function sanitize(p: Awaited<ReturnType<typeof listOidcProviders>>[number]) {
  const { client_secret: _s, ...rest } = p;
  return rest;
}

export default async function handleOidcProvider(
  req: Request,
  path: string,
): Promise<Response> {
  if (req.method === "GET" && path === `${PRE}/list`) {
    return wrapper(async () => {
      const providers = await listOidcProviders();
      return providers.map(sanitize);
    }, req);
  }

  if (req.method === "POST" && path === `${PRE}/add`) {
    const body = await req.json();
    const { name, issuer_url, client_id, client_secret, scopes } = body;
    if (!name || !issuer_url || !client_id || !client_secret) {
      return badRequest(
        "name, issuer_url, client_id and client_secret are required",
      );
    }
    return wrapper(async () => {
      await addOidcProvider(
        name,
        issuer_url,
        client_id,
        client_secret,
        scopes || "openid profile email",
      );
      return { ok: true };
    }, req);
  }

  if (req.method === "POST" && path === `${PRE}/update`) {
    const body = await req.json();
    const { id, name, issuer_url, client_id, client_secret, scopes } = body;
    if (!id) return badRequest("id is required");
    return wrapper(async () => {
      await updateOidcProvider(
        id,
        name,
        issuer_url,
        client_id,
        client_secret,
        scopes,
      );
      return { ok: true };
    }, req);
  }

  if (req.method === "POST" && path === `${PRE}/enable`) {
    const { id } = await req.json();
    if (!id) return badRequest("id is required");
    return wrapper(async () => {
      await toggleOidcProvider(id, true);
      return { ok: true };
    }, req);
  }

  if (req.method === "POST" && path === `${PRE}/disable`) {
    const { id } = await req.json();
    if (!id) return badRequest("id is required");
    return wrapper(async () => {
      await toggleOidcProvider(id, false);
      return { ok: true };
    }, req);
  }

  if (req.method === "POST" && path === `${PRE}/del`) {
    const { id } = await req.json();
    if (!id) return badRequest("id is required");
    return wrapper(async () => {
      await deleteOidcProvider(id);
      return { ok: true };
    }, req);
  }

  return notFound();
}
