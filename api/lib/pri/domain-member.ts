import { notFound } from "../http/response.ts";
import { pri as wrapper } from "../http/wrapper.ts";
import { getIdentityRole } from "../database/identity.ts";
import {
  addDomainMember,
  delDomainMember,
  listDomainMember,
} from "../database/domain-member.ts";

const PRE = "/api/pri/domain/member";

// -----------------------------------------------------------------------------
async function assertSuperAdmin(identityId: string): Promise<void> {
  const rows = await getIdentityRole(identityId);
  if (!rows[0]?.is_superadmin) throw new Error("forbidden");
}

// -----------------------------------------------------------------------------
async function list(req: Request, identityId: string): Promise<unknown> {
  await assertSuperAdmin(identityId);
  const pl = await req.json();
  return await listDomainMember(pl.domain_id);
}

// -----------------------------------------------------------------------------
async function add(req: Request, identityId: string): Promise<unknown> {
  await assertSuperAdmin(identityId);
  const pl = await req.json();
  return await addDomainMember(pl.domain_id, pl.email);
}

// -----------------------------------------------------------------------------
async function del(req: Request, identityId: string): Promise<unknown> {
  await assertSuperAdmin(identityId);
  const pl = await req.json();
  return await delDomainMember(pl.id);
}

// -----------------------------------------------------------------------------
export default async function routeDomainMember(
  req: Request,
  path: string,
  identityId: string,
): Promise<Response> {
  if (path === `${PRE}/list`) {
    return await wrapper(list, req, identityId);
  } else if (path === `${PRE}/add`) {
    return await wrapper(add, req, identityId);
  } else if (path === `${PRE}/del`) {
    return await wrapper(del, req, identityId);
  } else {
    return notFound();
  }
}
