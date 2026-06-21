import { notFound } from "../http/response.ts";
import { pri as wrapper } from "../http/wrapper.ts";
import { getPref, updatePref } from "../database/pref.ts";

const PRE = "/api/pri/pref";

// -----------------------------------------------------------------------------
async function get(_req: Request, identityId: string): Promise<unknown> {
  const rows = await getPref(identityId);
  return rows[0] ?? { pref_lang: null, pref_theme: null };
}

// -----------------------------------------------------------------------------
async function update(req: Request, identityId: string): Promise<unknown> {
  const pl = await req.json();
  await updatePref(identityId, pl.lang ?? null, pl.theme ?? null);
  const rows = await getPref(identityId);
  return rows[0] ?? { pref_lang: null, pref_theme: null };
}

// -----------------------------------------------------------------------------
export default function routePref(
  req: Request,
  path: string,
  identityId: string,
): Promise<Response> {
  if (path === `${PRE}/get`) {
    return wrapper(get, req, identityId);
  } else if (path === `${PRE}/update`) {
    return wrapper(update, req, identityId);
  } else {
    return notFound();
  }
}
