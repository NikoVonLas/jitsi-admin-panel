import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useIsMobile } from '../useIsMobile';

describe('useIsMobile', () => {
  let mockAddEventListener: ReturnType<typeof vi.fn>;
  let mockRemoveEventListener: ReturnType<typeof vi.fn>;
  let capturedHandler: ((e: { matches: boolean }) => void) | undefined;

  beforeEach(() => {
    mockAddEventListener = vi.fn((_, handler) => {
      capturedHandler = handler;
    });
    mockRemoveEventListener = vi.fn();

    Object.defineProperty(globalThis, 'matchMedia', {
      writable: true,
      value: vi.fn((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: mockAddEventListener,
        removeEventListener: mockRemoveEventListener,
        dispatchEvent: vi.fn(),
      })),
    });

    Object.defineProperty(globalThis, 'innerWidth', {
      writable: true,
      value: 1200,
    });
  });

  it('returns false on desktop (wide screen)', () => {
    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(false);
  });

  it('returns true on mobile (narrow screen)', () => {
    Object.defineProperty(globalThis, 'innerWidth', {
      writable: true,
      value: 375,
    });
    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(true);
  });

  it('respects custom breakpoint', () => {
    Object.defineProperty(globalThis, 'innerWidth', {
      writable: true,
      value: 500,
    });
    const { result } = renderHook(() => useIsMobile(768));
    expect(result.current).toBe(true);
  });

  it('updates when media query changes', () => {
    const { result } = renderHook(() => useIsMobile());
    act(() => {
      capturedHandler?.({ matches: true });
    });
    expect(result.current).toBe(true);
  });

  it('removes event listener on unmount', () => {
    const { unmount } = renderHook(() => useIsMobile());
    unmount();
    expect(mockRemoveEventListener).toHaveBeenCalled();
  });
});
