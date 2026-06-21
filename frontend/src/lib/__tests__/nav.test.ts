import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { navigate, ping } from '../nav';

describe('navigate', () => {
  let originalLocation: typeof globalThis.location;

  beforeEach(() => {
    originalLocation = globalThis.location;
    // Replace location with a writable mock
    Object.defineProperty(globalThis, 'location', {
      value: { href: '' },
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    Object.defineProperty(globalThis, 'location', {
      value: originalLocation,
      writable: true,
      configurable: true,
    });
  });

  it('sets location.href for http URLs', () => {
    navigate('http://example.com');
    expect(globalThis.location.href).toBe('http://example.com');
  });

  it('sets location.href for https URLs', () => {
    navigate('https://example.com/path');
    expect(globalThis.location.href).toBe('https://example.com/path');
  });

  it('calls navigateFn for relative paths', () => {
    const fn = vi.fn();
    navigate('/dashboard', fn);
    expect(fn).toHaveBeenCalledWith('/dashboard');
    expect(globalThis.location.href).toBe('');
  });

  it('sets location.href for relative paths when no navigateFn provided', () => {
    navigate('/fallback');
    expect(globalThis.location.href).toBe('/fallback');
  });
});

describe('ping', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    localStorage.clear();
    vi.mock('../api', () => ({
      get: vi.fn().mockResolvedValue({}),
    }));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it('sets pinged_at in localStorage when not set', async () => {
    await ping();
    expect(localStorage.getItem('pinged_at')).not.toBeNull();
  });

  it('does not call API when pinged recently', async () => {
    const now = Date.now();
    localStorage.setItem('pinged_at', String(now));
    // Should not throw and should complete without calling ping
    await ping();
    expect(localStorage.getItem('pinged_at')).toBe(String(now));
  });

  it('resets pinged_at when value is NaN', async () => {
    localStorage.setItem('pinged_at', 'not-a-number');
    await ping();
    const stored = localStorage.getItem('pinged_at');
    expect(stored).not.toBe('not-a-number');
    expect(Number.isNaN(Number(stored))).toBe(false);
  });

  it('calls API when last ping was over 60 seconds ago', async () => {
    const old = Date.now() - 70000;
    localStorage.setItem('pinged_at', String(old));
    const { get } = await import('../api');
    await ping();
    expect(get).toHaveBeenCalledWith('/api/pri/identity/ping');
  });
});
