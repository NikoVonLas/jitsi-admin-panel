import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LoginPage from '../LoginPage';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

vi.mock('../../i18n', () => ({
  useTr: () => (key: string) => key,
}));

describe('LoginPage', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    localStorage.clear();
    sessionStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it('renders without crashing while loading config', () => {
    globalThis.fetch = vi.fn().mockReturnValue(new Promise(() => {}));
    render(<LoginPage />);
  });

  it('redirects to /meeting when the session marker exists', () => {
    sessionStorage.setItem('session_authenticated', 'ok');
    globalThis.fetch = vi.fn().mockReturnValue(new Promise(() => {}));
    render(<LoginPage />);
    expect(mockNavigate).toHaveBeenCalledWith('/meeting', { replace: true });
  });

  it('ignores legacy auth markers that do not prove a current session', () => {
    localStorage.setItem('auth_token', 'legacy-token');
    sessionStorage.setItem('oidc_authenticated', 'ok');
    globalThis.fetch = vi.fn().mockReturnValue(new Promise(() => {}));
    render(<LoginPage />);
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('shows loading text while fetching config', async () => {
    globalThis.fetch = vi.fn().mockReturnValue(new Promise(() => {}));
    render(<LoginPage />);
    expect(screen.getByText('login.loading')).toBeInTheDocument();
  });

  it('shows login title after loading config with local auth', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      json: async () => ({ local: true, oidc: false, setup: false, oidc_providers: [] }),
    });
    render(<LoginPage />);
    await waitFor(() => expect(screen.getByText('login.title')).toBeInTheDocument());
  });

  it('shows first_run title in setup mode', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      json: async () => ({ local: true, oidc: false, setup: true, oidc_providers: [] }),
    });
    render(<LoginPage />);
    await waitFor(() => expect(screen.getByText('login.first_run')).toBeInTheDocument());
  });

  it('shows OIDC provider buttons when oidc is enabled', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      json: async () => ({
        local: false,
        oidc: true,
        setup: false,
        oidc_providers: [{ id: 'google', name: 'Google' }],
      }),
    });
    render(<LoginPage />);
    await waitFor(() => expect(screen.getByText(/Google/)).toBeInTheDocument());
  });

  it('falls back to local auth config on fetch error', async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error('network'));
    render(<LoginPage />);
    await waitFor(() => expect(screen.getByText('login.title')).toBeInTheDocument());
  });

  it('submits local credentials and stores only a non-secret session marker', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        json: async () => ({ local: true, oidc: false, setup: false, oidc_providers: [] }),
      })
      .mockResolvedValueOnce({ ok: true });
    globalThis.fetch = fetchMock;
    const user = userEvent.setup();
    render(<LoginPage />);

    await user.type(await screen.findByPlaceholderText('Email'), 'Admin@Example.com');
    await user.type(screen.getByPlaceholderText('login.placeholder_password'), 'secret-password');
    await user.click(screen.getByRole('button', { name: 'btn.sign_in' }));

    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true }));
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      '/api/adm/auth/local/login',
      expect.objectContaining({
        body: JSON.stringify({ email: 'admin@example.com', password: 'secret-password' }),
      })
    );
    expect(sessionStorage.getItem('session_authenticated')).toBe('ok');
    expect(sessionStorage.getItem('session_auth_method')).toBe('local');
    expect(localStorage.getItem('auth_token')).toBeNull();
  });
});
