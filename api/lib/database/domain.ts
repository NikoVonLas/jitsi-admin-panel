import { checkAttr, fetch } from "./common.ts";
import type { Attr, Domain, Domain333, Id } from "./types.ts";

// Get a domain by id (full details, for superadmin edit).
export async function getDomain(domainId: string) {
  const sql = {
    text: `
      SELECT id, name, auth_type, domain_attr, public, enabled,
             created_at, updated_at
      FROM domain
      WHERE id = $1`,
    args: [domainId],
  };

  return await fetch(sql) as Domain[];
}

// Returns the domain if the identity is allowed to use it:
// either the domain is public, or the identity's email is in domain_member.
export async function getDomainIfAllowed(identityId: string, domainId: string) {
  const sql = {
    text: `
      SELECT id, name, auth_type, domain_attr, public, enabled,
             created_at, updated_at
      FROM domain d
      WHERE id = $2
        AND enabled
        AND (public
             OR EXISTS (
               SELECT 1 FROM domain_member dm
               WHERE dm.domain_id = d.id
                 AND dm.email = (
                   SELECT identity_attr->>'email'
                   FROM identity WHERE id = $1
                 )
             )
            )`,
    args: [identityId, domainId],
  };

  return await fetch(sql) as Domain[];
}

// Returns the domain for the identity key (legacy stub).
export function getDomainByKeyIfAllowed(_keyValue: string) {
  return [] as Domain[];
}

// List domains accessible to an identity.
// Superadmins see all domains; regular users see public + member-by-email.
export async function listDomain(
  identityId: string,
  isSuperAdmin: boolean,
  limit: number,
  offset: number,
) {
  if (isSuperAdmin) {
    const sql = {
      text: `
        SELECT id, name, auth_type,
          (CASE auth_type
             WHEN 'jaas' THEN domain_attr->>'jaas_url'
             ELSE domain_attr->>'url'
           END) as url,
          public, enabled, updated_at
        FROM domain
        ORDER BY name
        LIMIT $1 OFFSET $2`,
      args: [limit, offset],
    };
    return await fetch(sql) as Domain333[];
  }

  const sql = {
    text: `
      SELECT id, name, auth_type,
        (CASE auth_type
           WHEN 'jaas' THEN domain_attr->>'jaas_url'
           ELSE domain_attr->>'url'
         END) as url,
        public, enabled, updated_at
      FROM domain d
      WHERE enabled
        AND (public
             OR EXISTS (
               SELECT 1 FROM domain_member dm
               WHERE dm.domain_id = d.id
                 AND dm.email = (
                   SELECT identity_attr->>'email'
                   FROM identity WHERE id = $1
                 )
             ))
      ORDER BY name
      LIMIT $2 OFFSET $3`,
    args: [identityId, limit, offset],
  };

  return await fetch(sql) as Domain333[];
}

// Add a new domain (owned by the system account).
export async function addDomain(
  name: string,
  authType: string,
  domainAttr: Attr,
  isPublic: boolean,
) {
  checkAttr(domainAttr);

  const sql = {
    text: `
      INSERT INTO domain (name, auth_type, domain_attr, public)
      VALUES ($1, $2, $3::jsonb, $4)
      RETURNING id, created_at as at`,
    args: [name, authType, domainAttr, isPublic],
  };

  return await fetch(sql) as Id[];
}

// Delete a domain.
export async function delDomain(domainId: string) {
  const sql = {
    text: `
      DELETE FROM domain
      WHERE id = $1
      RETURNING id, now() as at`,
    args: [domainId],
  };

  return await fetch(sql) as Id[];
}

// Update a domain's configuration.
export async function updateDomain(
  domainId: string,
  name: string,
  authType: string,
  domainAttr: Attr,
  isPublic: boolean,
) {
  checkAttr(domainAttr);

  const sql = {
    text: `
      UPDATE domain
      SET name = $2,
          auth_type = $3,
          domain_attr = $4::jsonb,
          public = $5,
          updated_at = now()
      WHERE id = $1
      RETURNING id, updated_at as at`,
    args: [domainId, name, authType, domainAttr, isPublic],
  };

  return await fetch(sql) as Id[];
}

// Enable or disable a domain.
export async function updateDomainEnabled(domainId: string, value: boolean) {
  const sql = {
    text: `
      UPDATE domain
      SET enabled = $2,
          updated_at = now()
      WHERE id = $1
      RETURNING id, updated_at as at`,
    args: [domainId, value],
  };

  return await fetch(sql) as Id[];
}
