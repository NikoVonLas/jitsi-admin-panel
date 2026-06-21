import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render } from '@testing-library/react';
import OidcValidate from '../OidcValidate';

vi.mock('../../../lib/api', () => ({
  get: vi.fn().mockResolvedValue({}),
  action: vi.fn().mockResolvedValue({ id: 'x' }),
}));

import { action } from '../../../lib/api';

let locationReplaceMock: ReturnType<typeof vi.fn>;

describe('OidcValidate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    sessionStorage.clear();
    locationReplaceMock = vi.fn();
    vi.stubGlobal('location', {
      replace: locationReplaceMock,
      href: 'http://localhost/',
      origin: 'http://localhost',
      search: '?code=test-code',
      pathname: '/',
      hash: '',
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    localStorage.clear();
    sessionStorage.clear();
  });

  it('renders without crashing', () => {
    render(<OidcValidate />);
  });

  it('returns null', () => {
    const { container } = render(<OidcValidate />);
    expect(container.firstChild).toBeNull();
  });

  it('sets oidc_authenticated in sessionStorage', async () => {
    render(<OidcValidate />);
    await new Promise((r) => setTimeout(r, 20));
    expect(sessionStorage.getItem('oidc_authenticated')).toBe('ok');
  });

  it('sets auth_token in localStorage on success', async () => {
    render(<OidcValidate />);
    await new Promise((r) => setTimeout(r, 20));
    expect(localStorage.getItem('auth_token')).toBe('oidc');
  });

  it('redirects to / on success (default next)', async () => {
    render(<OidcValidate />);
    await new Promise((r) => setTimeout(r, 20));
    expect(locationReplaceMock).toHaveBeenCalledWith('/');
  });

  it('redirects to /login when no code in URL', async () => {
    vi.stubGlobal('location', {
      replace: locationReplaceMock,
      href: 'http://localhost/',
      origin: 'http://localhost',
      search: '',
      pathname: '/',
    });
    render(<OidcValidate />);
    await new Promise((r) => setTimeout(r, 20));
    expect(locationReplaceMock).toHaveBeenCalledWith('/login');
  });

  it('redirects to /login when action throws', async () => {
    vi.mocked(action).mockRejectedValue(new Error('fail'));
    render(<OidcValidate />);
    await new Promise((r) => setTimeout(r, 20));
    expect(locationReplaceMock).toHaveBeenCalledWith('/login');
  });

  it('preserves theme and lang from localStorage', async () => {
    localStorage.setItem('theme', 'dark');
    localStorage.setItem('lang', 'ru');
    render(<OidcValidate />);
    await new Promise((r) => setTimeout(r, 20));
    expect(localStorage.getItem('theme')).toBe('dark');
    expect(localStorage.getItem('lang')).toBe('ru');
  });
});
