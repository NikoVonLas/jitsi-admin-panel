import { fetch } from "./common.ts";
import type { Id } from "./types.ts";

export interface DomainMemberRow {
  id: string;
  email: string;
  created_at: string;
}

// -----------------------------------------------------------------------------
export async function listDomainMember(domainId: string) {
  const sql = {
    text: `
      SELECT id, email, created_at
      FROM domain_member
      WHERE domain_id = $1
      ORDER BY email`,
    args: [domainId],
  };

  return await fetch(sql) as DomainMemberRow[];
}

// -----------------------------------------------------------------------------
export async function addDomainMember(domainId: string, email: string) {
  const sql = {
    text: `
      INSERT INTO domain_member (domain_id, email)
      VALUES ($1, $2)
      ON CONFLICT (domain_id, email) DO NOTHING
      RETURNING id, created_at as at`,
    args: [domainId, email],
  };

  return await fetch(sql) as Id[];
}

// -----------------------------------------------------------------------------
export async function delDomainMember(memberId: string) {
  const sql = {
    text: `
      DELETE FROM domain_member
      WHERE id = $1
      RETURNING id, now() as at`,
    args: [memberId],
  };

  return await fetch(sql) as Id[];
}
