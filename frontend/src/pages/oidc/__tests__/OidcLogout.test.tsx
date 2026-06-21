import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render } from '@testing-library/react';
import OidcLogout from '../OidcLogout';

let locationReplaceMock: ReturnType<typeof vi.fn>;

describe('OidcLogout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
  });

  it('renders without crashing', () => {
    globalThis.fetch = vi.fn().mockReturnValue(new Promise(() => {}));
    render(<OidcLogout />);
  });

  it('returns null', () => {
    globalThis.fetch = vi.fn().mockReturnValue(new Promise(() => {}));
    const { container } = render(<OidcLogout />);
    expect(container.firstChild).toBeNull();
  });

  it('redirects to logout URL when provided', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      status: 200,
      json: async () => [{ logout_url: 'https://sso.example.com/logout' }],
    });
    render(<OidcLogout />);
    await new Promise((r) => setTimeout(r, 10));
    expect(locationReplaceMock).toHaveBeenCalledWith('https://sso.example.com/logout');
  });

  it('falls back to /oidc/clean when no logout URL', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      status: 200,
      json: async () => [{ logout_url: null }],
    });
    render(<OidcLogout />);
    await new Promise((r) => setTimeout(r, 10));
    expect(locationReplaceMock).toHaveBeenCalledWith('/oidc/clean');
  });

  it('falls back to /oidc/clean on fetch error', async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error('network'));
    render(<OidcLogout />);
    await new Promise((r) => setTimeout(r, 10));
    expect(locationReplaceMock).toHaveBeenCalledWith('/oidc/clean');
  });

  it('falls back to /oidc/clean when response is not 200', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      status: 401,
      json: async () => [],
    });
    render(<OidcLogout />);
    await new Promise((r) => setTimeout(r, 10));
    expect(locationReplaceMock).toHaveBeenCalledWith('/oidc/clean');
  });
});
