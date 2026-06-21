import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render } from '@testing-library/react';
import HomePage from '../HomePage';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

describe('HomePage', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    localStorage.clear();
    sessionStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it('renders without crashing', () => {
    render(<HomePage />);
  });

  it('navigates to /login when not authenticated', async () => {
    render(<HomePage />);
    expect(mockNavigate).toHaveBeenCalledWith('/login', { replace: true });
  });

  it('navigates to /meeting when auth_token is set', async () => {
    localStorage.setItem('auth_token', 'token123');
    render(<HomePage />);
    expect(mockNavigate).toHaveBeenCalledWith('/meeting', { replace: true });
  });

  it('navigates to /meeting when oidc_authenticated is set', async () => {
    sessionStorage.setItem('oidc_authenticated', 'ok');
    render(<HomePage />);
    expect(mockNavigate).toHaveBeenCalledWith('/meeting', { replace: true });
  });

  it('returns null (renders nothing)', () => {
    const { container } = render(<HomePage />);
    expect(container.firstChild).toBeNull();
  });
});
