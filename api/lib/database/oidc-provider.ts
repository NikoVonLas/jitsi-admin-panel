import { fetch, pool } from "./common.ts";

export interface OidcProviderRow {
  id: string;
  name: string;
  issuer_url: string;
  client_id: string;
  client_secret: string;
  scopes: string;
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

// Shorter row for public listing (no secret)
export interface OidcProviderPublic {
  id: string;
  name: string;
  enabled: boolean;
}

// -----------------------------------------------------------------------------
export async function listOidcProviders(): Promise<OidcProviderRow[]> {
  const sql = {
    text: `
      SELECT id, name, issuer_url, client_id, client_secret, scopes, enabled,
             created_at, updated_at
      FROM oidc_provider
      ORDER BY created_at`,
  };
  return await fetch(sql) as OidcProviderRow[];
}

// -----------------------------------------------------------------------------
export async function getOidcProvider(
  id: string,
): Promise<OidcProviderRow | undefined> {
  const sql = {
    text: `
      SELECT id, name, issuer_url, client_id, client_secret, scopes, enabled,
             created_at, updated_at
      FROM oidc_provider
      WHERE id = $1`,
    args: [id],
  };
  const rows = await fetch(sql) as OidcProviderRow[];
  return rows[0];
}

// -----------------------------------------------------------------------------
export async function getFirstEnabledOidcProvider(): Promise<
  OidcProviderRow | undefined
> {
  const sql = {
    text: `
      SELECT id, name, issuer_url, client_id, client_secret, scopes, enabled,
             created_at, updated_at
      FROM oidc_provider
      WHERE enabled = true
      ORDER BY created_at
      LIMIT 1`,
  };
  const rows = await fetch(sql) as OidcProviderRow[];
  return rows[0];
}

// -----------------------------------------------------------------------------
export async function hasEnabledOidcProvider(): Promise<boolean> {
  const sql = {
    text: `SELECT COUNT(*) AS cnt FROM oidc_provider WHERE enabled = true`,
  };
  const rows = await fetch(sql) as { cnt: string }[];
  return Number(rows[0]?.cnt ?? 0) > 0;
}

// -----------------------------------------------------------------------------
export async function listEnabledOidcProviders(): Promise<
  OidcProviderPublic[]
> {
  const sql = {
    text: `
      SELECT id, name, enabled
      FROM oidc_provider
      WHERE enabled = true
      ORDER BY created_at`,
  };
  return await fetch(sql) as OidcProviderPublic[];
}

// -----------------------------------------------------------------------------
export async function addOidcProvider(
  name: string,
  issuerUrl: string,
  clientId: string,
  clientSecret: string,
  scopes: string,
): Promise<{ id: string }[]> {
  const sql = {
    text: `
      INSERT INTO oidc_provider (name, issuer_url, client_id, client_secret, scopes)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id`,
    args: [name, issuerUrl, clientId, clientSecret, scopes],
  };
  return await fetch(sql) as { id: string }[];
}

// -----------------------------------------------------------------------------
export async function updateOidcProvider(
  id: string,
  name: string,
  issuerUrl: string,
  clientId: string,
  clientSecret: string,
  scopes: string,
): Promise<void> {
  using client = await pool.connect();

  if (clientSecret === "") {
    // Preserve existing secret
    await client.queryObject({
      text: `
        UPDATE oidc_provider
        SET name=$2, issuer_url=$3, client_id=$4, scopes=$5, updated_at=now()
        WHERE id=$1`,
      args: [id, name, issuerUrl, clientId, scopes],
    });
  } else {
    // Update all fields including secret
    await client.queryObject({
      text: `
        UPDATE oidc_provider
        SET name=$2, issuer_url=$3, client_id=$4, client_secret=$5, scopes=$6,
            updated_at=now()
        WHERE id=$1`,
      args: [id, name, issuerUrl, clientId, clientSecret, scopes],
    });
  }
}

// -----------------------------------------------------------------------------
export async function deleteOidcProvider(id: string): Promise<void> {
  using client = await pool.connect();
  await client.queryObject({
    text: `DELETE FROM oidc_provider WHERE id=$1`,
    args: [id],
  });
}

// -----------------------------------------------------------------------------
export async function toggleOidcProvider(
  id: string,
  enabled: boolean,
): Promise<void> {
  using client = await pool.connect();
  await client.queryObject({
    text: `UPDATE oidc_provider SET enabled=$2, updated_at=now() WHERE id=$1`,
    args: [id, enabled],
  });
}
