import { ok } from "../http/response.ts";
import { LANG, WEEK_START } from "../../config.ts";
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
  const weekStart = await getSetting("week_start", String(WEEK_START));
  const lang = await getSetting("lang", LANG);

  const config = [{
    week_start: Number(weekStart),
    lang: lang,
  }];

  return ok(JSON.stringify(config));
}
