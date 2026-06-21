import { notFound } from "../http/response.ts";
import { adm as wrapper } from "../http/wrapper.ts";
import { upsertSetting } from "../database/setting.ts";
import { ALLOWED_KEYS, getFiltered, SECRET_KEYS } from "../common/setting.ts";

const PRE = "/api/adm/setting";

// -----------------------------------------------------------------------------
async function get(_req: Request): Promise<unknown> {
  return await getFiltered();
}

// -----------------------------------------------------------------------------
async function update(req: Request): Promise<unknown> {
  const pl = await req.json();

  for (const key of ALLOWED_KEYS) {
    if (pl[key] === undefined) continue;
    // Never overwrite a secret with an empty string
    if (SECRET_KEYS.has(key) && pl[key] === "") continue;
    await upsertSetting(key, String(pl[key]));
  }

  return getFiltered();
}

// -----------------------------------------------------------------------------
export default function handleSetting(
  req: Request,
  path: string,
): Promise<Response> {
  if (path === `${PRE}/get`) {
    return wrapper(get, req);
  } else if (path === `${PRE}/update`) {
    return wrapper(update, req);
  } else {
    return notFound();
  }
}
