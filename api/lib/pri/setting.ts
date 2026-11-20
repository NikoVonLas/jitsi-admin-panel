import { notFound } from "../http/response.ts";
import { HttpError } from "../http/error.ts";
import { pri as wrapper } from "../http/wrapper.ts";
import { getIdentityRole } from "../database/identity.ts";
import { getFiltered, updateSettings } from "../common/setting.ts";

const PRE = "/api/pri/setting";

// -----------------------------------------------------------------------------
async function assertSuperAdmin(identityId: string): Promise<void> {
  const rows = await getIdentityRole(identityId);
  if (!rows[0]?.is_superadmin) throw new HttpError(403, "Forbidden");
}

// -----------------------------------------------------------------------------
async function get(_req: Request, identityId: string): Promise<unknown> {
  await assertSuperAdmin(identityId);
  return await getFiltered();
}

// -----------------------------------------------------------------------------
async function update(req: Request, identityId: string): Promise<unknown> {
  await assertSuperAdmin(identityId);

  return await updateSettings(await req.json());
}

// -----------------------------------------------------------------------------
export default async function routeSetting(
  req: Request,
  path: string,
  identityId: string,
): Promise<Response> {
  if (path === `${PRE}/get`) {
    return await wrapper(get, req, identityId);
  } else if (path === `${PRE}/update`) {
    return await wrapper(update, req, identityId);
  } else {
    return notFound();
  }
}
