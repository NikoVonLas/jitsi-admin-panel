import { fetch } from "./common.ts";
import type { Id, Identity } from "./types.ts";

// -----------------------------------------------------------------------------
export async function getIdentity(identityId: string) {
  const sql = {
    text: `
      SELECT id, identity_attr, enabled, created_at, updated_at, seen_at
      FROM identity
      WHERE id = $1`,
    args: [
      identityId,
    ],
  };

  return await fetch(sql) as Identity[];
}

// -----------------------------------------------------------------------------
// The consumer is internal while processing requests from a user accessing by
// using an identity key.
// -----------------------------------------------------------------------------
export async function getIdentityByKey(keyValue: string) {
  const sql = {
    text: `
      SELECT id, identity_attr, enabled, created_at, updated_at, seen_at
      FROM identity
      WHERE id = (SELECT identity_id
                  FROM identity_key
                  WHERE value = $1
                    AND enabled
                 )`,
    args: [
      keyValue,
    ],
  };

  return await fetch(sql) as Identity[];
}

// -----------------------------------------------------------------------------
// The consumer is the mailer. So, dont return the identity if the email for
// this phone is disabled.
// -----------------------------------------------------------------------------
export async function getIdentityByCode(code: string) {
  const sql = {
    text: `
      SELECT i.id, identity_attr, i.enabled, i.created_at, i.updated_at, seen_at
      FROM identity i
        JOIN phone ph ON ph.identity_id = i.id
                         AND ph.code = $1
                         AND ph.enabled
                         AND ph.email_enabled
        JOIN domain d ON ph.domain_id = d.id
                         AND d.enabled
      WHERE i.enabled`,
    args: [
      code,
    ],
  };

  return await fetch(sql) as Identity[];
}

// -----------------------------------------------------------------------------
export async function setIdentityEmail(identityId: string, email: string) {
  const sql = {
    text: `
      UPDATE identity
      SET
        identity_attr['email'] = to_jsonb($2::text),
        updated_at = now()
      WHERE id = $1
      RETURNING id, updated_at as at`,
    args: [
      identityId,
      email,
    ],
  };

  return await fetch(sql) as Id[];
}

// -----------------------------------------------------------------------------
export async function getIdentityRole(identityId: string) {
  const sql = {
    text: `
      SELECT is_superadmin
      FROM identity
      WHERE id = $1`,
    args: [identityId],
  };

  return await fetch(sql) as { is_superadmin: boolean }[];
}

// -----------------------------------------------------------------------------
export async function countSuperAdmins(): Promise<number> {
  const sql = {
    text: `SELECT COUNT(*) as cnt FROM identity WHERE is_superadmin = true`,
    args: [],
  };
  const rows = await fetch(sql) as { cnt: string }[];
  return Number.parseInt(rows[0]?.cnt ?? "0", 10);
}

// -----------------------------------------------------------------------------
export async function setSuperAdmin(identityId: string, value: boolean) {
  const sql = {
    text: `
      UPDATE identity
      SET is_superadmin = $2,
          updated_at = now()
      WHERE id = $1
      RETURNING id`,
    args: [identityId, value],
  };

  return await fetch(sql) as { id: string }[];
}

// -----------------------------------------------------------------------------
export async function updatePresence(identityId: string) {
  const sql = {
    text: `
      UPDATE identity
      SET
        seen_at = now()
      WHERE id = $1
      RETURNING id, seen_at as at`,
    args: [
      identityId,
    ],
  };

  return await fetch(sql) as Id[];
}

// -----------------------------------------------------------------------------
export async function searchIdentity(q: string, limit: number) {
  const pattern = `%${q}%`;
  const sql = {
    text: `
      SELECT id,
        identity_attr->>'email' as email,
        (SELECT name FROM profile WHERE identity_id = identity.id AND is_default LIMIT 1) as name
      FROM identity
      WHERE identity_attr->>'email' ILIKE $1
         OR (SELECT name FROM profile WHERE identity_id = identity.id AND is_default LIMIT 1) ILIKE $1
      ORDER BY identity_attr->>'email'
      LIMIT $2`,
    args: [pattern, limit],
  };
  return await fetch(sql) as {
    id: string;
    email: string;
    name: string | null;
  }[];
}

// -----------------------------------------------------------------------------
export async function getIsSuperAdmin(identityId: string): Promise<boolean> {
  const rows = await getIdentityRole(identityId);
  return rows[0]?.is_superadmin === true;
}

// -----------------------------------------------------------------------------
export async function updatePresenceByKey(keyValue: string) {
  const sql = {
    text: `
      UPDATE identity
      SET
        seen_at = now()
      WHERE id = (SELECT identity_id
                  FROM identity_key
                  WHERE value = $1
                    AND enabled
                 )
      RETURNING id, seen_at as at`,
    args: [
      keyValue,
    ],
  };

  return await fetch(sql) as Id[];
}
