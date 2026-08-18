import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import PrivateLayout from '../PrivateLayout';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', () => ({
  Outlet: () => <div data-testid="outlet">outlet</div>,
  useNavigate: () => mockNavigate,
}));

vi.mock('../../store/role', () => ({
  useRoleStore: () => ({ load: vi.fn() }),
}));

vi.mock('../../store/pref', () => ({
  usePrefStore: () => ({ load: vi.fn() }),
}));

describe('PrivateLayout', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    localStorage.clear();
    sessionStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it('redirects to /login when not authenticated', () => {
    render(<PrivateLayout />);
    expect(mockNavigate).toHaveBeenCalledWith('/login', { replace: true });
  });

  it('renders null when not authenticated', () => {
    const { container } = render(<PrivateLayout />);
    expect(container.firstChild).toBeNull();
  });

  it('renders Outlet when the session marker exists', () => {
    sessionStorage.setItem('session_authenticated', 'ok');
    render(<PrivateLayout />);
    expect(screen.getByTestId('outlet')).toBeInTheDocument();
  });

  it('does not trust a legacy localStorage token', () => {
    localStorage.setItem('auth_token', 'token123');
    render(<PrivateLayout />);
    expect(screen.queryByTestId('outlet')).toBeNull();
  });

  it('does not redirect when authenticated', () => {
    sessionStorage.setItem('session_authenticated', 'ok');
    render(<PrivateLayout />);
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
