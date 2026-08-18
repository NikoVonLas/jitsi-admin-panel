import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, waitFor } from '@testing-library/react';
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
    vi.mocked(action).mockResolvedValue({ id: 'x', next: '/' });
    locationReplaceMock = vi.fn();
    vi.stubGlobal('location', {
      replace: locationReplaceMock,
      href: 'http://localhost/',
      origin: 'http://localhost',
      search: '?code=test-code&state=test-state',
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

  it('sets the unified session marker in sessionStorage', async () => {
    render(<OidcValidate />);
    await new Promise((r) => setTimeout(r, 20));
    expect(sessionStorage.getItem('session_authenticated')).toBe('ok');
    expect(sessionStorage.getItem('session_auth_method')).toBe('oidc');
  });

  it('does not mark the session authenticated before code exchange succeeds', async () => {
    let resolveExchange!: (value: { id: string; next: string }) => void;
    vi.mocked(action).mockReturnValue(
      new Promise((resolve) => {
        resolveExchange = resolve;
      })
    );

    render(<OidcValidate />);
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(sessionStorage.getItem('session_authenticated')).toBeNull();

    resolveExchange({ id: 'x', next: '/' });
    await waitFor(() => expect(sessionStorage.getItem('session_authenticated')).toBe('ok'));
  });

  it('does not store a token in localStorage on success', async () => {
    render(<OidcValidate />);
    await new Promise((r) => setTimeout(r, 20));
    expect(localStorage.getItem('auth_token')).toBeNull();
  });

  it('redirects to / on success (default next)', async () => {
    render(<OidcValidate />);
    await new Promise((r) => setTimeout(r, 20));
    expect(locationReplaceMock).toHaveBeenCalledWith('/');
  });

  it('passes both code and state to the backend and uses its next path', async () => {
    vi.mocked(action).mockResolvedValue({ id: 'x', next: '/meeting?view=list' });
    render(<OidcValidate />);
    await waitFor(() => expect(locationReplaceMock).toHaveBeenCalledWith('/meeting?view=list'));
    expect(action).toHaveBeenCalledWith('/api/adm/identity/get/bycode', {
      code: 'test-code',
      state: 'test-state',
    });
  });

  it('rejects a protocol-relative next path returned by the backend', async () => {
    vi.mocked(action).mockResolvedValue({ id: 'x', next: '//evil.example' });
    render(<OidcValidate />);
    await waitFor(() => expect(locationReplaceMock).toHaveBeenCalledWith('/'));
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
