import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../http', () => ({
  httpPost: vi.fn(),
}));

import { httpPost } from '../http';
import {
  action,
  actionById,
  actionByCode,
  get,
  getById,
  getByCode,
  list,
  listById,
  listFiltered,
  listByValue,
} from '../api';

const mockHttpPost = vi.mocked(httpPost);

function makeRes(status: number, data: unknown = [{ id: 'x' }]) {
  return {
    status,
    json: async () => data,
  } as unknown as Response;
}

describe('action', () => {
  beforeEach(() => {
    mockHttpPost.mockReset();
  });

  it('returns first row on 200', async () => {
    mockHttpPost.mockResolvedValueOnce(makeRes(200, [{ id: 'abc' }]));
    const result = await action('/api/test', {});
    expect(result).toEqual({ id: 'abc' });
  });

  it('throws on non-200 status', async () => {
    mockHttpPost.mockResolvedValueOnce(makeRes(401));
    await expect(action('/api/test', {})).rejects.toThrow('401');
  });

  it('throws when rows[0] is undefined', async () => {
    mockHttpPost.mockResolvedValueOnce(makeRes(200, []));
    await expect(action('/api/test', {})).rejects.toThrow('no result');
  });
});

describe('actionById', () => {
  beforeEach(() => mockHttpPost.mockReset());

  it('posts with id payload', async () => {
    mockHttpPost.mockResolvedValueOnce(makeRes(200));
    await actionById('/api/test', 'my-id');
    expect(mockHttpPost).toHaveBeenCalledWith('/api/test', { id: 'my-id' });
  });
});

describe('actionByCode', () => {
  beforeEach(() => mockHttpPost.mockReset());

  it('posts with code payload', async () => {
    mockHttpPost.mockResolvedValueOnce(makeRes(200));
    await actionByCode('/api/test', 'my-code');
    expect(mockHttpPost).toHaveBeenCalledWith('/api/test', { code: 'my-code' });
  });
});

describe('get', () => {
  beforeEach(() => mockHttpPost.mockReset());

  it('posts empty payload', async () => {
    mockHttpPost.mockResolvedValueOnce(makeRes(200));
    await get('/api/test');
    expect(mockHttpPost).toHaveBeenCalledWith('/api/test', {});
  });
});

describe('getById', () => {
  beforeEach(() => mockHttpPost.mockReset());

  it('posts with id', async () => {
    mockHttpPost.mockResolvedValueOnce(makeRes(200));
    await getById('/api/test', 'id-1');
    expect(mockHttpPost).toHaveBeenCalledWith('/api/test', { id: 'id-1' });
  });
});

describe('getByCode', () => {
  beforeEach(() => mockHttpPost.mockReset());

  it('posts with code', async () => {
    mockHttpPost.mockResolvedValueOnce(makeRes(200));
    await getByCode('/api/test', 'code-1');
    expect(mockHttpPost).toHaveBeenCalledWith('/api/test', { code: 'code-1' });
  });
});

describe('list', () => {
  beforeEach(() => mockHttpPost.mockReset());

  it('returns json on 200', async () => {
    const data = [{ id: '1' }, { id: '2' }];
    mockHttpPost.mockResolvedValueOnce(makeRes(200, data));
    const result = await list('/api/test');
    expect(result).toEqual(data);
  });

  it('uses default limit/offset', async () => {
    mockHttpPost.mockResolvedValueOnce(makeRes(200, []));
    await list('/api/test');
    expect(mockHttpPost).toHaveBeenCalledWith('/api/test', {
      limit: 10,
      offset: 0,
    });
  });

  it('accepts custom limit/offset', async () => {
    mockHttpPost.mockResolvedValueOnce(makeRes(200, []));
    await list('/api/test', 25, 50);
    expect(mockHttpPost).toHaveBeenCalledWith('/api/test', {
      limit: 25,
      offset: 50,
    });
  });

  it('throws on non-200', async () => {
    mockHttpPost.mockResolvedValueOnce(makeRes(500));
    await expect(list('/api/test')).rejects.toThrow('post failed');
  });
});

describe('listById', () => {
  beforeEach(() => mockHttpPost.mockReset());

  it('posts with id and pagination', async () => {
    mockHttpPost.mockResolvedValueOnce(makeRes(200, []));
    await listById('/api/test', 'room-1', 5, 10);
    expect(mockHttpPost).toHaveBeenCalledWith('/api/test', {
      id: 'room-1',
      limit: 5,
      offset: 10,
    });
  });

  it('throws on non-200', async () => {
    mockHttpPost.mockResolvedValueOnce(makeRes(403));
    await expect(listById('/api/test', 'x')).rejects.toThrow('post failed');
  });
});

describe('listFiltered', () => {
  beforeEach(() => mockHttpPost.mockReset());

  it('sends basic payload', async () => {
    mockHttpPost.mockResolvedValueOnce(
      makeRes(200, { items: [], total: 0 }),
    );
    await listFiltered('/api/test', { limit: 10, offset: 0 });
    expect(mockHttpPost).toHaveBeenCalledWith(
      '/api/test',
      expect.objectContaining({ limit: 10, offset: 0, search: '', enabled: null }),
    );
  });

  it('includes optional fields when defined', async () => {
    mockHttpPost.mockResolvedValueOnce(
      makeRes(200, { items: [], total: 0 }),
    );
    await listFiltered('/api/test', {
      limit: 5,
      offset: 0,
      has_session: true,
      room_id: 'r1',
      domain_id: 'd1',
      identity_id: 'i1',
      session_date: '2024-06-01',
    });
    const payload = mockHttpPost.mock.calls[0][1];
    expect(payload.has_session).toBe(true);
    expect(payload.room_id).toBe('r1');
    expect(payload.domain_id).toBe('d1');
    expect(payload.identity_id).toBe('i1');
    expect(payload.session_date).toBe('2024-06-01');
  });

  it('converts empty optional strings to null', async () => {
    mockHttpPost.mockResolvedValueOnce(
      makeRes(200, { items: [], total: 0 }),
    );
    await listFiltered('/api/test', {
      limit: 10,
      offset: 0,
      room_id: '',
      domain_id: '',
    });
    const payload = mockHttpPost.mock.calls[0][1];
    expect(payload.room_id).toBeNull();
    expect(payload.domain_id).toBeNull();
  });

  it('throws on non-200', async () => {
    mockHttpPost.mockResolvedValueOnce(makeRes(500));
    await expect(
      listFiltered('/api/test', { limit: 10, offset: 0 }),
    ).rejects.toThrow('post failed');
  });
});

describe('listByValue', () => {
  beforeEach(() => mockHttpPost.mockReset());

  it('posts with value and pagination', async () => {
    mockHttpPost.mockResolvedValueOnce(makeRes(200, []));
    await listByValue('/api/test', 'query', 20, 5);
    expect(mockHttpPost).toHaveBeenCalledWith('/api/test', {
      value: 'query',
      limit: 20,
      offset: 5,
    });
  });

  it('throws on non-200', async () => {
    mockHttpPost.mockResolvedValueOnce(makeRes(404));
    await expect(listByValue('/api/test', 'q')).rejects.toThrow('post failed');
  });
});
