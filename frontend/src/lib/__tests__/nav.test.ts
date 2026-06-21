import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { navigate } from '../nav';

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
