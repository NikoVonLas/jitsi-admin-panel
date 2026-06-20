// Private API: local user management (superadmin only)
// Routes (all POST, authenticated via cookie token):
//   /api/pri/user/list      → list all local users
//   /api/pri/user/add       → create a new local user
//   /api/pri/user/del       → delete a local user by id
//   /api/pri/user/set-admin → promote / demote superadmin flag

import { forbidden, notFound } from "../http/response.ts";
import { pri as wrapper } from "../http/wrapper.ts";
import {
  countSuperAdmins,
  getIdentityRole,
  setIdentityEmail,
  setSuperAdmin,
} from "../database/identity.ts";
import {
  createLocalIdentity,
  deleteLocalIdentity,
  getIdentityByEmail,
  listLocalUsers,
} from "../database/identity-local.ts";
import { addProfile } from "../database/profile.ts";
import { hashPassword } from "../common/password.ts";
import { AUTH_LOCAL } from "../../config.ts";

const PRE = "/api/pri/user";

// -----------------------------------------------------------------------------
async function list(_req: Request, _identityId: string): Promise<unknown> {
  return await listLocalUsers();
}

// -----------------------------------------------------------------------------
async function add(req: Request, _identityId: string): Promise<unknown> {
  const body = await req.json();
  const email: string = (body.email ?? "").trim().toLowerCase();
  const password: string = body.password ?? "";
  const name: string = (body.name ?? "").trim() || email.split("@")[0];
  const isSuperAdmin: boolean = body.is_superadmin === true;

  if (!email || !password || password.length < 14) {
    throw new Error("bad request");
  }

  const existing = await getIdentityByEmail(email);
  if (existing[0]) throw new Error("conflict");

  const passwordHash = await hashPassword(password);
  const rows = await createLocalIdentity(email, passwordHash);
  if (!rows[0]) throw new Error("create failed");

  const newId = rows[0].id;
  await setSuperAdmin(newId, isSuperAdmin);
  await setIdentityEmail(newId, email);
  await addProfile(newId, name, email, true);

  return { id: newId, email, name, is_superadmin: isSuperAdmin };
}

// -----------------------------------------------------------------------------
async function del(req: Request, identityId: string): Promise<unknown> {
  const body = await req.json();
  const targetId: string = body.id ?? "";
  if (!targetId) throw new Error("bad request");
  if (targetId === identityId) throw new Error("cannot delete yourself");

  await deleteLocalIdentity(targetId);
  return { ok: true };
}

// -----------------------------------------------------------------------------
async function setAdmin(req: Request, _identityId: string): Promise<unknown> {
  const body = await req.json();
  const targetId: string = body.id ?? "";
  const value: boolean = body.is_superadmin === true;
  if (!targetId) throw new Error("bad request");

  // Prevent removing the last superadmin
  if (!value) {
    const adminCount = await countSuperAdmins();
    if (adminCount <= 1) throw new Error("cannot remove the last superadmin");
  }

  await setSuperAdmin(targetId, value);
  return { ok: true };
}

// -----------------------------------------------------------------------------
export default async function routeLocalUser(
  req: Request,
  path: string,
  identityId: string,
): Promise<Response> {
  if (!AUTH_LOCAL) return forbidden();

  // All user management requires superadmin
  const roleRows = await getIdentityRole(identityId);
  if (!roleRows[0]?.is_superadmin) return forbidden();

  if (path === `${PRE}/list`) return await wrapper(list, req, identityId);
  if (path === `${PRE}/add`) return await wrapper(add, req, identityId);
  if (path === `${PRE}/del`) return await wrapper(del, req, identityId);
  if (path === `${PRE}/set-admin`) {
    return await wrapper(setAdmin, req, identityId);
  }

  return notFound();
}
