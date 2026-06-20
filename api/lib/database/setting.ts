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
  const sql = {
    text: `
      INSERT INTO setting (mkey, mvalue)
        VALUES ($1, $2)
        ON CONFLICT (mkey) DO UPDATE SET mvalue = $2`,
    args: [key, value],
  };

  await query(sql);
}
