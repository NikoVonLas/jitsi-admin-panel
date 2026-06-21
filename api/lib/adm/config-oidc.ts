import { ok } from "../http/response.ts";
import { LANG } from "../../config.ts";
import { getSettingValue } from "../database/setting.ts";

// -----------------------------------------------------------------------------
async function getSetting(key: string, envFallback: string): Promise<string> {
  try {
    const value = await getSettingValue(key);
    return value || envFallback;
  } catch {
    return envFallback;
  }
}

// -----------------------------------------------------------------------------
export default async function handleConfigOidc(): Promise<Response> {
  const lang = await getSetting("lang", LANG);

  const config = [{
    lang: lang,
  }];

  return ok(JSON.stringify(config));
}
