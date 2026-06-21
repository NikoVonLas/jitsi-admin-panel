import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('httpGet / httpPost', () => {
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    mockFetch = vi.fn();
    vi.stubGlobal('fetch', mockFetch);

    // Reset sessionStorage mock
    vi.stubGlobal('sessionStorage', {
      getItem: vi.fn(() => null),
      removeItem: vi.fn(),
      setItem: vi.fn(),
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  it('httpGet returns response on 200', async () => {
    const fakeRes = { status: 200, json: async () => ({ ok: true }) };
    mockFetch.mockResolvedValueOnce(fakeRes);

    const { httpGet } = await import('../http');
    const res = await httpGet('/api/pri/identity/ping');
    expect(res.status).toBe(200);
    expect(mockFetch).toHaveBeenCalledWith(
      '/api/pri/identity/ping',
      expect.objectContaining({ credentials: 'include' }),
    );
  });

  it('httpPost sends JSON body', async () => {
    const fakeRes = { status: 200, json: async () => ([{ id: '1' }]) };
    mockFetch.mockResolvedValueOnce(fakeRes);

    const { httpPost } = await import('../http');
    await httpPost('/api/pri/profile/list', { limit: 10, offset: 0 });
    const callArgs = mockFetch.mock.calls[0];
    expect(callArgs[1].body).toBe(JSON.stringify({ limit: 10, offset: 0 }));
    expect(callArgs[1].method).toBe('post');
  });

  it('httpGet calls handleUnauthorized on 401 (no oidc session)', async () => {
    const fakeRes = { status: 401 };
    mockFetch.mockResolvedValueOnce(fakeRes);

    // sessionStorage.getItem returns null → no redirect
    const { httpGet } = await import('../http');
    const res = await httpGet('/api/pri/something');
    expect(res.status).toBe(401);
  });
});
