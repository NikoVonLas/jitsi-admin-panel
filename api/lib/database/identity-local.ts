import { fetch, pool } from "./common.ts";
import type { Id } from "./types.ts";

// -----------------------------------------------------------------------------
// Row returned by getIdentityByEmail
// -----------------------------------------------------------------------------
export interface LocalIdentityRow {
  identity_id: string;
  email: string;
  password_hash: string;
}

// -----------------------------------------------------------------------------
// Find a local identity by email (JOIN with identity to confirm it exists)
// -----------------------------------------------------------------------------
export async function getIdentityByEmail(
  email: string,
): Promise<LocalIdentityRow[]> {
  const sql = {
    text: `
      SELECT il.identity_id, il.email, il.password_hash
      FROM identity_local il
        JOIN identity i ON i.id = il.identity_id
      WHERE il.email = $1`,
    args: [email],
  };

  return await fetch(sql) as LocalIdentityRow[];
}

// -----------------------------------------------------------------------------
// Create a new identity row + identity_local row in one transaction.
// Returns the new identity id.
// -----------------------------------------------------------------------------
export async function createLocalIdentity(
  email: string,
  passwordHash: string,
): Promise<Id[]> {
  using client = await pool.connect();
  const trans = client.createTransaction("create_local_identity");
  await trans.begin();

  // Generate UUID explicitly (identity.id has no DB default in older schemas)
  const identityId = crypto.randomUUID();

  // Insert into identity
  await trans.queryObject({
    text: `INSERT INTO identity (id) VALUES ($1)`,
    args: [identityId],
  });

  // Insert into identity_local
  await trans.queryObject({
    text: `
      INSERT INTO identity_local (identity_id, email, password_hash)
      VALUES ($1, $2, $3)`,
    args: [identityId, email, passwordHash],
  });

  await trans.commit();

  return [{ id: identityId, at: new Date().toISOString() }] as Id[];
}

// -----------------------------------------------------------------------------
// Update the password hash for an existing local identity
// -----------------------------------------------------------------------------
export async function updateLocalPasswordHash(
  identityId: string,
  passwordHash: string,
): Promise<Id[]> {
  const sql = {
    text: `
      UPDATE identity_local
      SET password_hash = $2,
          updated_at = now()
      WHERE identity_id = $1
      RETURNING identity_id as id, updated_at as at`,
    args: [identityId, passwordHash],
  };

  return await fetch(sql) as Id[];
}

// -----------------------------------------------------------------------------
// Check if any local users exist (for setup detection)
// -----------------------------------------------------------------------------
export async function hasAnyLocalUser(): Promise<boolean> {
  const sql = {
    text: `SELECT COUNT(*)::int AS count FROM identity_local`,
  };
  const rows = await fetch(sql) as { count: number }[];
  return (rows[0]?.count ?? 0) > 0;
}

// -----------------------------------------------------------------------------
// List all local users with their superadmin flag
// -----------------------------------------------------------------------------
export interface LocalUserRow {
  id: string;
  email: string;
  is_superadmin: boolean;
  created_at: string;
}

export async function listLocalUsers(): Promise<LocalUserRow[]> {
  const sql = {
    text: `
      SELECT il.identity_id as id, il.email, i.is_superadmin, il.created_at
      FROM identity_local il
        JOIN identity i ON i.id = il.identity_id
      ORDER BY il.created_at ASC`,
  };
  return await fetch(sql) as LocalUserRow[];
}

// -----------------------------------------------------------------------------
// Delete a local identity (cascades to identity via FK)
// -----------------------------------------------------------------------------
export async function deleteLocalIdentity(identityId: string): Promise<void> {
  const sql = {
    text: `DELETE FROM identity WHERE id = $1`,
    args: [identityId],
  };
  await fetch(sql);
}
