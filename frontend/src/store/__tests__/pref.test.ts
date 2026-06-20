import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act, renderHook } from '@testing-library/react';

// Mock api.ts and i18n before importing store
vi.mock('../../lib/api', () => ({
  action: vi.fn(),
  get: vi.fn(),
  getById: vi.fn(),
}));

vi.mock('../../i18n', () => ({
  useI18n: {
    getState: () => ({ setLang: vi.fn() }),
  },
  t: (k: string) => k,
  useTr: () => (k: string) => k,
}));

import { usePrefStore } from '../pref';
import { action, get as apiGet } from '../../lib/api';

const mockAction = action as ReturnType<typeof vi.fn>;
const mockGet = apiGet as ReturnType<typeof vi.fn>;

describe('usePrefStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    usePrefStore.setState({ lang: null, theme: 'system', loaded: false });
  });

  it('initial state', () => {
    const { result } = renderHook(() => usePrefStore());
    expect(result.current.lang).toBeNull();
    expect(result.current.theme).toBe('system');
    expect(result.current.loaded).toBe(false);
  });

  it('load populates lang and theme from API', async () => {
    mockGet.mockResolvedValueOnce({ pref_lang: 'ru', pref_theme: 'dark' });

    const { result } = renderHook(() => usePrefStore());
    await act(async () => {
      await result.current.load();
    });

    expect(result.current.lang).toBe('ru');
    expect(result.current.theme).toBe('dark');
    expect(result.current.loaded).toBe(true);
  });

  it('load falls back to system when API throws', async () => {
    mockGet.mockRejectedValueOnce(new Error('network error'));

    const { result } = renderHook(() => usePrefStore());
    await act(async () => {
      await result.current.load();
    });

    expect(result.current.lang).toBeNull();
    expect(result.current.theme).toBe('system');
  });

  it('does not re-fetch when already loaded', async () => {
    usePrefStore.setState({ loaded: true, lang: 'en', theme: 'light' });

    const { result } = renderHook(() => usePrefStore());
    await act(async () => {
      await result.current.load();
    });

    expect(mockGet).not.toHaveBeenCalled();
  });

  it('setLang updates lang in store and calls API', async () => {
    mockAction.mockResolvedValue({});

    const { result } = renderHook(() => usePrefStore());
    await act(async () => {
      await result.current.setLang('ru');
    });

    expect(result.current.lang).toBe('ru');
    expect(mockAction).toHaveBeenCalledWith(
      '/api/pri/pref/update',
      expect.objectContaining({ lang: 'ru' }),
    );
  });

  it('setTheme updates theme in store and calls API', async () => {
    mockAction.mockResolvedValue({});
    usePrefStore.setState({ lang: 'en', theme: 'system' });

    const { result } = renderHook(() => usePrefStore());
    await act(async () => {
      await result.current.setTheme('dark');
    });

    expect(result.current.theme).toBe('dark');
    expect(mockAction).toHaveBeenCalledWith(
      '/api/pri/pref/update',
      expect.objectContaining({ theme: 'dark' }),
    );
  });
});
