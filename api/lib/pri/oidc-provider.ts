import { forbidden, notFound } from "../http/response.ts";
import { HttpError } from "../http/error.ts";
import { pri as wrapper } from "../http/wrapper.ts";
import {
  addOidcProvider,
  deleteOidcProvider,
  listOidcProviders,
  toggleOidcProvider,
  updateOidcProvider,
} from "../database/oidc-provider.ts";
import { getIsSuperAdmin } from "../database/identity.ts";
import { isValidOidcIssuerUrl } from "../common/validate.ts";
import { ALLOW_UNSECURE_CERT } from "../../config.ts";

const PRE = "/api/pri/oidc-provider";

// -----------------------------------------------------------------------------
async function list(_req: Request, _identityId: string): Promise<unknown> {
  const rows = await listOidcProviders();
  // Never send client_secret to frontend
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    issuer_url: r.issuer_url,
    client_id: r.client_id,
    scopes: r.scopes,
    enabled: r.enabled,
    created_at: r.created_at,
    updated_at: r.updated_at,
  }));
}

// -----------------------------------------------------------------------------
async function add(req: Request, _identityId: string): Promise<unknown> {
  const pl = await req.json();
  const name: string = (pl.name ?? "SSO").trim();
  const issuerUrl: string = (pl.issuer_url ?? "").trim();
  const clientId: string = (pl.client_id ?? "").trim();
  const clientSecret: string = (pl.client_secret ?? "").trim();
  const scopes: string = (pl.scopes ?? "openid profile email").trim();

  if (!issuerUrl || !clientId) {
    throw new HttpError(400, "issuer_url and client_id are required");
  }
  if (!isValidOidcIssuerUrl(issuerUrl, ALLOW_UNSECURE_CERT)) {
    throw new HttpError(400, "Invalid OIDC issuer URL");
  }

  return await addOidcProvider(name, issuerUrl, clientId, clientSecret, scopes);
}

// -----------------------------------------------------------------------------
async function update(req: Request, _identityId: string): Promise<unknown> {
  const pl = await req.json();
  const id: string = pl.id ?? "";
  const name: string = (pl.name ?? "SSO").trim();
  const issuerUrl: string = (pl.issuer_url ?? "").trim();
  const clientId: string = (pl.client_id ?? "").trim();
  const clientSecret: string = (pl.client_secret ?? "").trim();
  const scopes: string = (pl.scopes ?? "openid profile email").trim();

  if (!id || !issuerUrl || !clientId) {
    throw new HttpError(400, "id, issuer_url and client_id are required");
  }
  if (!isValidOidcIssuerUrl(issuerUrl, ALLOW_UNSECURE_CERT)) {
    throw new HttpError(400, "Invalid OIDC issuer URL");
  }

  await updateOidcProvider(id, name, issuerUrl, clientId, clientSecret, scopes);
  return [{ ok: true }];
}

// -----------------------------------------------------------------------------
async function del(req: Request, _identityId: string): Promise<unknown> {
  const pl = await req.json();
  const id: string = pl.id ?? "";
  if (!id) throw new HttpError(400, "id is required");

  await deleteOidcProvider(id);
  return [{ ok: true }];
}

// -----------------------------------------------------------------------------
async function toggle(req: Request, _identityId: string): Promise<unknown> {
  const pl = await req.json();
  const id: string = pl.id ?? "";
  const enabled: boolean = Boolean(pl.enabled);
  if (!id) throw new HttpError(400, "id is required");

  await toggleOidcProvider(id, enabled);
  return [{ ok: true }];
}

// -----------------------------------------------------------------------------
export default async function routeOidcProvider(
  req: Request,
  path: string,
  identityId: string,
): Promise<Response> {
  if (!await getIsSuperAdmin(identityId)) return forbidden();

  if (path === `${PRE}/list`) {
    return await wrapper(list, req, identityId);
  } else if (path === `${PRE}/add`) {
    return await wrapper(add, req, identityId);
  } else if (path === `${PRE}/update`) {
    return await wrapper(update, req, identityId);
  } else if (path === `${PRE}/del`) {
    return await wrapper(del, req, identityId);
  } else if (path === `${PRE}/toggle`) {
    return await wrapper(toggle, req, identityId);
  } else {
    return notFound();
  }
}
