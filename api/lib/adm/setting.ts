import { notFound } from "../http/response.ts";
import { adm as wrapper } from "../http/wrapper.ts";
import { getFiltered, updateSettings } from "../common/setting.ts";

const PRE = "/api/adm/setting";

// -----------------------------------------------------------------------------
async function get(_req: Request): Promise<unknown> {
  return await getFiltered();
}

// -----------------------------------------------------------------------------
async function update(req: Request): Promise<unknown> {
  return await updateSettings(await req.json());
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
    return Promise.resolve(notFound());
  }
}
