import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
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

  it('redirects to /meeting when auth_token exists', () => {
    localStorage.setItem('auth_token', 'token123');
    globalThis.fetch = vi.fn().mockResolvedValue({ json: async () => ({}) });
    render(<LoginPage />);
    expect(mockNavigate).toHaveBeenCalledWith('/meeting', { replace: true });
  });

  it('redirects to /meeting when oidc_authenticated exists', () => {
    sessionStorage.setItem('oidc_authenticated', 'ok');
    globalThis.fetch = vi.fn().mockResolvedValue({ json: async () => ({}) });
    render(<LoginPage />);
    expect(mockNavigate).toHaveBeenCalledWith('/meeting', { replace: true });
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
        local: false, oidc: true, setup: false,
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
});
