import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render } from '@testing-library/react';
import OidcClean from '../OidcClean';

vi.mock('../../../lib/api', () => ({
  get: vi.fn().mockResolvedValue({}),
}));

let locationReplaceMock: ReturnType<typeof vi.fn>;

describe('OidcClean', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    locationReplaceMock = vi.fn();
    vi.stubGlobal('location', {
      replace: locationReplaceMock,
      href: 'http://localhost/',
      origin: 'http://localhost',
      search: '',
      pathname: '/',
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    localStorage.clear();
    sessionStorage.clear();
  });

  it('renders without crashing', () => {
    render(<OidcClean />);
  });

  it('returns null', () => {
    const { container } = render(<OidcClean />);
    expect(container.firstChild).toBeNull();
  });

  it('clears localStorage on mount', async () => {
    localStorage.setItem('key', 'value');
    render(<OidcClean />);
    await new Promise((r) => setTimeout(r, 10));
    expect(localStorage.getItem('key')).toBeNull();
  });

  it('clears sessionStorage on mount', async () => {
    sessionStorage.setItem('key', 'value');
    render(<OidcClean />);
    await new Promise((r) => setTimeout(r, 10));
    expect(sessionStorage.getItem('key')).toBeNull();
  });

  it('redirects to OIDC redirect URL', async () => {
    render(<OidcClean />);
    await new Promise((r) => setTimeout(r, 10));
    expect(locationReplaceMock).toHaveBeenCalledWith('/api/adm/oidc/redirect?prompt=consent');
  });
});
