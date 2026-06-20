// Re-exported mock helpers for API calls used in store / component tests
import { vi } from 'vitest';

export const mockHttpPost = vi.fn();
export const mockHttpGet = vi.fn();

vi.mock('../../lib/http', () => ({
  httpPost: mockHttpPost,
  httpGet: mockHttpGet,
}));
