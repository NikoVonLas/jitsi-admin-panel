import { fetch } from "./common.ts";

export interface Pref {
  pref_lang: string | null;
  pref_theme: string | null;
  pref_week_start: number | null;
}

// -----------------------------------------------------------------------------
export async function getPref(identityId: string) {
  const sql = {
    text: `
      SELECT pref_lang, pref_theme, pref_week_start
      FROM identity
      WHERE id = $1`,
    args: [identityId],
  };

  return await fetch(sql) as Pref[];
}

// -----------------------------------------------------------------------------
export async function updatePref(
  identityId: string,
  lang: string | null,
  theme: string | null,
  weekStart: number | null,
) {
  const sql = {
    text: `
      UPDATE identity
      SET pref_lang = $2, pref_theme = $3, pref_week_start = $4
      WHERE id = $1`,
    args: [identityId, lang, theme, weekStart],
  };

  await fetch(sql);
}
