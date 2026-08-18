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

  it('clears legacy authentication data without deleting preferences', async () => {
    localStorage.setItem('auth_token', 'legacy');
    localStorage.setItem('theme', 'dark');
    render(<OidcClean />);
    await new Promise((r) => setTimeout(r, 10));
    expect(localStorage.getItem('auth_token')).toBeNull();
    expect(localStorage.getItem('theme')).toBe('dark');
  });

  it('clears the authentication session marker on mount', async () => {
    sessionStorage.setItem('session_authenticated', 'ok');
    render(<OidcClean />);
    await new Promise((r) => setTimeout(r, 10));
    expect(sessionStorage.getItem('session_authenticated')).toBeNull();
  });

  it('redirects to the login page', async () => {
    render(<OidcClean />);
    await new Promise((r) => setTimeout(r, 10));
    expect(locationReplaceMock).toHaveBeenCalledWith('/login');
  });
});
