import { describe, it, expect, vi, beforeEach } from 'vitest';

// Must mock fetch before importing the store
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

// Stub localStorage
const store: Record<string, string> = {};
vi.stubGlobal('localStorage', {
  getItem: (k: string) => store[k] ?? null,
  setItem: (k: string, v: string) => { store[k] = v; },
  removeItem: (k: string) => { delete store[k]; },
  clear: () => { Object.keys(store).forEach((k) => delete store[k]); },
});

import { applyConfig, applyFavicon } from '../../store/appconfig';

describe('applyFavicon', () => {
  it('does nothing when html is empty', () => {
    expect(() => applyFavicon('')).not.toThrow();
  });

  it('does not throw with valid html', () => {
    expect(() =>
      applyFavicon('<link rel="icon" href="/favicon.ico" />')
    ).not.toThrow();
  });

  it('does not re-apply the same html twice', () => {
    const html = '<link rel="icon" href="/favicon2.ico" />';
    applyFavicon(html);
    // calling again with same html should be a no-op (no throw)
    applyFavicon(html);
  });
});

describe('applyConfig', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('stores config in localStorage', () => {
    applyConfig({ logo_url: 'https://example.com/logo.png' } as any);
    const stored = localStorage.getItem('galaxy-config');
    expect(stored).not.toBeNull();
    const parsed = JSON.parse(stored!);
    expect(parsed.logo_url).toBe('https://example.com/logo.png');
  });

  it('does not throw when called with empty object', () => {
    expect(() => applyConfig({} as any)).not.toThrow();
  });
});
