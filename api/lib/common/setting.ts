import { getSettings } from "../database/setting.ts";
import { LANG } from "../../config.ts";
import { MAILER_FROM, MAILER_TRANSPORT_OPTIONS } from "../../config.mailer.ts";

// -----------------------------------------------------------------------------
export const ALLOWED_KEYS = new Set([
  "lang",
  "mailer_host",
  "mailer_port",
  "mailer_secure",
  "mailer_user",
  "mailer_pass",
  "mailer_from",
  "logo_url",
  "color_bg_light",
  "color_bg_dark",
  "color_text_light",
  "color_text_dark",
  "color_link_light",
  "color_link_dark",
  "color_navbar_light",
  "color_navbar_dark",
]);

// These keys are never sent to the frontend
export const SECRET_KEYS = new Set(["mailer_pass"]);

// Default values from environment variables
export const ENV_DEFAULTS: Record<string, string> = {
  lang: LANG,
  mailer_host: MAILER_TRANSPORT_OPTIONS.host,
  mailer_port: String(MAILER_TRANSPORT_OPTIONS.port),
  mailer_secure: String(MAILER_TRANSPORT_OPTIONS.secure),
  mailer_user: MAILER_TRANSPORT_OPTIONS.auth.user,
  mailer_from: MAILER_FROM,
};

// -----------------------------------------------------------------------------
export async function getFiltered() {
  const dbRows = await getSettings();
  const dbMap = new Map(dbRows.map((s) => [s.mkey, s.mvalue]));

  // DB rows, minus secrets
  const result: { mkey: string; mvalue: string }[] = [];
  for (const row of dbRows) {
    if (!SECRET_KEYS.has(row.mkey)) result.push(row);
  }

  // Env defaults for keys not yet in DB (minus secrets)
  for (const [key, value] of Object.entries(ENV_DEFAULTS)) {
    if (!dbMap.has(key) && value !== "") {
      result.push({ mkey: key, mvalue: value });
    }
  }

  return result;
}
