import { notFound } from "../http/response.ts";
import { pri as wrapper } from "../http/wrapper.ts";
import { isValidUrl } from "../common/validate.ts";
import { getLimit, getOffset } from "../database/common.ts";
import { getIdentityRole } from "../database/identity.ts";
import {
  addDomain,
  delDomain,
  getDomain,
  listDomain,
  updateDomain,
  updateDomainEnabled,
} from "../database/domain.ts";
import type { Attr } from "../database/types.ts";

const PRE = "/api/pri/domain";

// -----------------------------------------------------------------------------
async function assertSuperAdmin(identityId: string): Promise<void> {
  const rows = await getIdentityRole(identityId);
  if (!rows[0]?.is_superadmin) throw new Error("forbidden");
}

// -----------------------------------------------------------------------------
async function get(req: Request, _identityId: string): Promise<unknown> {
  const pl = await req.json();
  return await getDomain(pl.id);
}

// -----------------------------------------------------------------------------
async function list(req: Request, identityId: string): Promise<unknown> {
  const pl = await req.json();
  const limit = getLimit(pl.limit);
  const offset = getOffset(pl.offset);

  const roleRows = await getIdentityRole(identityId);
  const isSuperAdmin = roleRows[0]?.is_superadmin === true;

  return await listDomain(identityId, isSuperAdmin, limit, offset);
}

// -----------------------------------------------------------------------------
async function add(req: Request, identityId: string): Promise<unknown> {
  await assertSuperAdmin(identityId);

  const pl = await req.json();
  const name = pl.name;
  const authType = pl.auth_type;
  const domainAttr = pl.domain_attr as Attr;
  const isPublic = pl.public === true;

  if (authType === "jaas") {
    if (!isValidUrl(domainAttr.jaas_url)) throw new Error("invalid input");
  } else if (!isValidUrl(domainAttr.url)) {
    throw new Error("invalid input");
  }

  return await addDomain(name, authType, domainAttr, isPublic);
}

// -----------------------------------------------------------------------------
async function del(req: Request, identityId: string): Promise<unknown> {
  await assertSuperAdmin(identityId);
  const pl = await req.json();
  return await delDomain(pl.id);
}

// -----------------------------------------------------------------------------
async function update(req: Request, identityId: string): Promise<unknown> {
  await assertSuperAdmin(identityId);

  const pl = await req.json();
  const domainId = pl.id;
  const name = pl.name;
  const authType = pl.auth_type;
  const domainAttr = pl.domain_attr as Attr;
  const isPublic = pl.public === true;

  if (authType === "jaas") {
    if (!isValidUrl(domainAttr.jaas_url)) throw new Error("invalid input");
  } else if (!isValidUrl(domainAttr.url)) {
    throw new Error("invalid input");
  }

  return await updateDomain(domainId, name, authType, domainAttr, isPublic);
}

// -----------------------------------------------------------------------------
async function enable(req: Request, identityId: string): Promise<unknown> {
  await assertSuperAdmin(identityId);
  const pl = await req.json();
  return await updateDomainEnabled(pl.id, true);
}

// -----------------------------------------------------------------------------
async function disable(req: Request, identityId: string): Promise<unknown> {
  await assertSuperAdmin(identityId);
  const pl = await req.json();
  return await updateDomainEnabled(pl.id, false);
}

// -----------------------------------------------------------------------------
export default async function routeDomain(
  req: Request,
  path: string,
  identityId: string,
): Promise<Response> {
  if (path === `${PRE}/get`) {
    return await wrapper(get, req, identityId);
  } else if (path === `${PRE}/list`) {
    return await wrapper(list, req, identityId);
  } else if (path === `${PRE}/add`) {
    return await wrapper(add, req, identityId);
  } else if (path === `${PRE}/del`) {
    return await wrapper(del, req, identityId);
  } else if (path === `${PRE}/update`) {
    return await wrapper(update, req, identityId);
  } else if (path === `${PRE}/enable`) {
    return await wrapper(enable, req, identityId);
  } else if (path === `${PRE}/disable`) {
    return await wrapper(disable, req, identityId);
  } else {
    return notFound();
  }
}
