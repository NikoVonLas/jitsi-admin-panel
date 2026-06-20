import { httpPost } from './http';

export async function action(url: string, payload: unknown) {
  const res = await httpPost(url, payload);
  if (res.status !== 200) throw new Error(String(res.status));
  const rows = await res.json();
  if (!rows[0]) throw new Error('no result');
  return rows[0];
}

export async function actionById(url: string, id: string) {
  return action(url, { id });
}

export async function actionByCode(url: string, code: string) {
  return action(url, { code });
}

export async function get(url: string) {
  return action(url, {});
}

export async function getById(url: string, id: string) {
  return action(url, { id });
}

export async function getByCode(url: string, code: string) {
  return action(url, { code });
}

export async function list(url: string, limit = 10, offset = 0) {
  const res = await httpPost(url, { limit, offset });
  if (res.status !== 200) throw new Error('post failed');
  return res.json();
}

export async function listById(url: string, id: string, limit = 10, offset = 0) {
  const res = await httpPost(url, { id, limit, offset });
  if (res.status !== 200) throw new Error('post failed');
  return res.json();
}

export interface ListFilteredOpts {
  limit: number;
  offset: number;
  search?: string;
  enabled?: boolean | null;
  has_session?: boolean | null;
  room_id?: string;
  domain_id?: string;
  identity_id?: string;
  session_date?: string;
}

export async function listFiltered<T = unknown>(
  url: string,
  opts: ListFilteredOpts
): Promise<{ items: T[]; total: number }> {
  const payload: Record<string, unknown> = {
    limit: opts.limit,
    offset: opts.offset,
    search: opts.search ?? '',
    enabled: opts.enabled ?? null,
  };
  if (opts.has_session !== undefined) payload.has_session = opts.has_session ?? null;
  if (opts.room_id !== undefined) payload.room_id = opts.room_id || null;
  if (opts.domain_id !== undefined) payload.domain_id = opts.domain_id || null;
  if (opts.identity_id !== undefined) payload.identity_id = opts.identity_id || null;
  if (opts.session_date !== undefined) payload.session_date = opts.session_date || null;
  const res = await httpPost(url, payload);
  if (res.status !== 200) throw new Error('post failed');
  return res.json() as Promise<{ items: T[]; total: number }>;
}

export async function listByValue(url: string, value: string, limit = 10, offset = 0) {
  const res = await httpPost(url, { value, limit, offset });
  if (res.status !== 200) throw new Error('post failed');
  return res.json();
}
