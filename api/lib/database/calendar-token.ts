import { fetch, query } from "./common.ts";

// -----------------------------------------------------------------------------
export async function getOrCreateCalendarToken(
  identityId: string,
): Promise<string> {
  const sql = {
    text: `
      INSERT INTO calendar_token (identity_id)
        VALUES ($1)
        ON CONFLICT (identity_id) DO NOTHING`,
    args: [identityId],
  };
  await query(sql);

  const getSql = {
    text: `
      SELECT token
      FROM calendar_token
      WHERE identity_id = $1`,
    args: [identityId],
  };
  const rows = await fetch(getSql) as { token: string }[];

  return rows[0].token;
}

// -----------------------------------------------------------------------------
export async function regenerateCalendarToken(
  identityId: string,
): Promise<string> {
  const sql = {
    text: `
      INSERT INTO calendar_token (identity_id)
        VALUES ($1)
        ON CONFLICT (identity_id)
        DO UPDATE SET token = md5(random()::text) || md5(random()::text)
      RETURNING token`,
    args: [identityId],
  };
  const rows = await fetch(sql) as { token: string }[];

  return rows[0].token;
}

// -----------------------------------------------------------------------------
export async function getIdentityByCalendarToken(
  token: string,
): Promise<string | undefined> {
  const sql = {
    text: `
      SELECT identity_id
      FROM calendar_token
      WHERE token = $1
        AND enabled`,
    args: [token],
  };
  const rows = await fetch(sql) as { identity_id: string }[];

  return rows[0]?.identity_id;
}
