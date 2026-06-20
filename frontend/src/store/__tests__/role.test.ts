import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act, renderHook } from '@testing-library/react';

// Mock api.ts
vi.mock('../../lib/api', () => ({
  action: vi.fn(),
  get: vi.fn(),
  getById: vi.fn(),
  list: vi.fn(),
  listFiltered: vi.fn(),
}));

import { useRoleStore } from '../role';
import { action } from '../../lib/api';

const mockAction = action as ReturnType<typeof vi.fn>;

describe('useRoleStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset store state
    useRoleStore.setState({ isSuperAdmin: null, loaded: false });
  });

  it('initial state: isSuperAdmin=null, loaded=false', () => {
    const { result } = renderHook(() => useRoleStore());
    expect(result.current.isSuperAdmin).toBeNull();
    expect(result.current.loaded).toBe(false);
  });

  it('load sets isSuperAdmin=true when API returns is_superadmin=true', async () => {
    mockAction.mockResolvedValueOnce({ is_superadmin: true });

    const { result } = renderHook(() => useRoleStore());
    await act(async () => {
      await result.current.load();
    });

    expect(result.current.isSuperAdmin).toBe(true);
    expect(result.current.loaded).toBe(true);
  });

  it('load sets isSuperAdmin=false when API returns is_superadmin=false', async () => {
    mockAction.mockResolvedValueOnce({ is_superadmin: false });

    const { result } = renderHook(() => useRoleStore());
    await act(async () => {
      await result.current.load();
    });

    expect(result.current.isSuperAdmin).toBe(false);
  });

  it('load sets isSuperAdmin=false when API throws', async () => {
    mockAction.mockRejectedValueOnce(new Error('unauthorized'));

    const { result } = renderHook(() => useRoleStore());
    await act(async () => {
      await result.current.load();
    });

    expect(result.current.isSuperAdmin).toBe(false);
  });

  it('does not re-fetch when already loaded', async () => {
    mockAction.mockResolvedValue({ is_superadmin: true });
    useRoleStore.setState({ loaded: true, isSuperAdmin: true });

    const { result } = renderHook(() => useRoleStore());
    await act(async () => {
      await result.current.load();
    });

    expect(mockAction).not.toHaveBeenCalled();
  });
});
