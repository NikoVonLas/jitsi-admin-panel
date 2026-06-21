import { query } from "../../lib/database/common.ts";

// ---------------------------------------------------------------------------
// cleanDb — truncates all user-created rows while preserving the system account
// and system domains. Call in beforeEach for integration tests.
// ---------------------------------------------------------------------------
// Initial system domains seeded by 02-create-jitsi-tables.sql.
// These must survive cleanDb so the app stays functional between tests.
const SYSTEM_DOMAIN_NAMES = ["meet.jit.si", "meet.element.io"];

export async function cleanDb(): Promise<void> {
  // Delete all non-system identities (cascades to profile, domain, room,
  // meeting, intercom, etc.)
  await query({
    text:
      `DELETE FROM identity WHERE id != '00000000-0000-0000-0000-000000000000'`,
  });

  // Remove system-account domains created during tests (addDomain defaults
  // identity_id to the system account after the migration). Keep only the
  // original seeded domains so app config isn't disturbed.
  await query({
    text: `DELETE FROM domain
           WHERE identity_id = '00000000-0000-0000-0000-000000000000'
             AND name != ALL($1::text[])`,
    args: [SYSTEM_DOMAIN_NAMES],
  });

  // Clean standalone tables that are not owned by an identity
  await query({ text: `DELETE FROM setting` });
  await query({ text: `DELETE FROM oidc_provider` });
}

// ---------------------------------------------------------------------------
// makeRequest — builds a Request object for handler tests
// ---------------------------------------------------------------------------
export function makeRequest(
  method: string,
  path: string,
  body?: unknown,
  headers?: Record<string, string>,
): Request {
  const url = `http://test${path}`;
  const init: RequestInit = { method };

  if (body !== undefined) {
    init.body = JSON.stringify(body);
    init.headers = {
      "Content-Type": "application/json",
      ...headers,
    };
  } else if (headers) {
    init.headers = headers;
  }

  return new Request(url, init);
}

// ---------------------------------------------------------------------------
// cookieRequest — builds a Request with a token cookie (for pri handler tests)
// ---------------------------------------------------------------------------
export function cookieRequest(
  method: string,
  path: string,
  token: string,
  body?: unknown,
): Request {
  return makeRequest(method, path, body, {
    Cookie: `token=${token}`,
  });
}
