import { query } from "../../lib/database/common.ts";

// ---------------------------------------------------------------------------
// cleanDb — truncates all user-created rows while preserving the system account
// and system domains. Call in beforeEach for integration tests.
// ---------------------------------------------------------------------------
export async function cleanDb(): Promise<void> {
  // Delete all non-system identities (cascades to profile, domain, room,
  // meeting, intercom, etc.)
  await query({
    text:
      `DELETE FROM identity WHERE id != '00000000-0000-0000-0000-000000000000'`,
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
