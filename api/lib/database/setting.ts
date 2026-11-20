import { fetch, query } from "./common.ts";

export interface Setting {
  mkey: string;
  mvalue: string;
}

// -----------------------------------------------------------------------------
export async function getSettings(): Promise<Setting[]> {
  const sql = {
    text: `SELECT mkey, mvalue FROM setting ORDER BY mkey`,
  };

  return await fetch(sql) as Setting[];
}

// -----------------------------------------------------------------------------
export async function getSettingValue(key: string): Promise<string> {
  const sql = {
    text: `SELECT mvalue FROM setting WHERE mkey = $1`,
    args: [key],
  };

  const rows = await fetch(sql) as Setting[];
  return rows[0]?.mvalue ?? "";
}

// -----------------------------------------------------------------------------
export async function upsertSetting(key: string, value: string): Promise<void> {
  await upsertSettings({ [key]: value });
}

export async function upsertSettings(
  values: Record<string, string>,
): Promise<void> {
  await query({
    text: `INSERT INTO setting (mkey, mvalue)
      SELECT key, value FROM jsonb_each_text($1::jsonb) ORDER BY key
      ON CONFLICT (mkey) DO UPDATE SET mvalue = EXCLUDED.mvalue`,
    args: [values],
  });
}
