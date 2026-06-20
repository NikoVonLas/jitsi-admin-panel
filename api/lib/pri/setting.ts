import { notFound } from "../http/response.ts";
import { pri as wrapper } from "../http/wrapper.ts";
import { getIdentityRole } from "../database/identity.ts";
import { upsertSetting } from "../database/setting.ts";
import { ALLOWED_KEYS, getFiltered, SECRET_KEYS } from "../common/setting.ts";

const PRE = "/api/pri/setting";

// -----------------------------------------------------------------------------
async function assertSuperAdmin(identityId: string): Promise<void> {
  const rows = await getIdentityRole(identityId);
  if (!rows[0]?.is_superadmin) throw new Error("forbidden");
}

// -----------------------------------------------------------------------------
async function get(_req: Request, identityId: string): Promise<unknown> {
  await assertSuperAdmin(identityId);
  return await getFiltered();
}

// -----------------------------------------------------------------------------
async function update(req: Request, identityId: string): Promise<unknown> {
  await assertSuperAdmin(identityId);

  const pl = await req.json();

  for (const key of ALLOWED_KEYS) {
    if (pl[key] === undefined) continue;
    if (SECRET_KEYS.has(key) && pl[key] === "") continue;
    await upsertSetting(key, String(pl[key]));
  }

  return await getFiltered();
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
