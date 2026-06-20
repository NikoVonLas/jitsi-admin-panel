import { badRequest, notFound, ok } from "../http/response.ts";
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
    return await wrapper(async () => {
      const providers = await listOidcProviders();
      return ok(JSON.stringify(providers.map(sanitize)));
    }, req);
  }

  if (req.method === "POST" && path === `${PRE}/add`) {
    return await wrapper(async () => {
      const body = await req.json();
      const { name, issuer_url, client_id, client_secret, scopes } = body;
      if (!name || !issuer_url || !client_id || !client_secret) {
        return badRequest(
          "name, issuer_url, client_id and client_secret are required",
        );
      }
      await addOidcProvider(
        name,
        issuer_url,
        client_id,
        client_secret,
        scopes || "openid profile email",
      );
      return ok(
        JSON.stringify({ ok: true }),
      );
    }, req);
  }

  if (req.method === "POST" && path === `${PRE}/update`) {
    return await wrapper(async () => {
      const body = await req.json();
      const { id, name, issuer_url, client_id, client_secret, scopes } = body;
      if (!id) return badRequest("id is required");
      await updateOidcProvider(
        id,
        name,
        issuer_url,
        client_id,
        client_secret,
        scopes,
      );
      return ok(JSON.stringify({ ok: true }));
    }, req);
  }

  if (req.method === "POST" && path === `${PRE}/enable`) {
    return await wrapper(async () => {
      const { id } = await req.json();
      if (!id) return badRequest("id is required");
      await toggleOidcProvider(id, true);
      return ok(JSON.stringify({ ok: true }));
    }, req);
  }

  if (req.method === "POST" && path === `${PRE}/disable`) {
    return await wrapper(async () => {
      const { id } = await req.json();
      if (!id) return badRequest("id is required");
      await toggleOidcProvider(id, false);
      return ok(JSON.stringify({ ok: true }));
    }, req);
  }

  if (req.method === "POST" && path === `${PRE}/del`) {
    return await wrapper(async () => {
      const { id } = await req.json();
      if (!id) return badRequest("id is required");
      await deleteOidcProvider(id);
      return ok(JSON.stringify({ ok: true }));
    }, req);
  }

  return notFound();
}
