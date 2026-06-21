import { notFound } from "../http/response.ts";
import { pri as wrapper } from "../http/wrapper.ts";
import {
  getIdentityRole,
  searchIdentity,
  updatePresence,
} from "../database/identity.ts";

export { getIdentityRole };

const PRE = "/api/pri/identity";

// -----------------------------------------------------------------------------
async function ping(_req: Request, identityId: string): Promise<unknown> {
  return await updatePresence(identityId);
}

// -----------------------------------------------------------------------------
async function role(_req: Request, identityId: string): Promise<unknown> {
  const rows = await getIdentityRole(identityId);
  return [rows[0] ?? { is_superadmin: false }];
}

// -----------------------------------------------------------------------------
async function search(req: Request, identityId: string): Promise<unknown> {
  const roleRows = await getIdentityRole(identityId);
  if (roleRows[0]?.is_superadmin !== true) return [];

  const pl = await req.json();
  const q = typeof pl.q === "string" ? pl.q.trim() : "";
  if (q.length < 2) return [];

  return searchIdentity(q, 5);
}

// -----------------------------------------------------------------------------
export default function routeIdentity(
  req: Request,
  path: string,
  identityId: string,
): Promise<Response> {
  if (path === `${PRE}/ping`) {
    return wrapper(ping, req, identityId);
  } else if (path === `${PRE}/role`) {
    return wrapper(role, req, identityId);
  } else if (path === `${PRE}/search`) {
    return wrapper(search, req, identityId);
  } else {
    return Promise.resolve(notFound());
  }
}
