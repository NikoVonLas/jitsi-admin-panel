import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import Layout from '../Layout';

vi.mock('react-router-dom', () => ({
  Outlet: () => <div data-testid="outlet">outlet</div>,
  useLocation: () => ({ pathname: '/meeting', search: '', hash: '', state: null }),
}));

vi.mock('../../store/appconfig', () => ({
  useAppConfig: vi.fn((selector?: (s: object) => unknown) => {
    const store = { load: vi.fn(), config: { logo_url: '', app_name: '' } };
    return typeof selector === 'function' ? selector(store) : store;
  }),
}));

vi.mock('../../components/nav/NavBarPri', () => ({
  default: () => <nav data-testid="navbar-pri">NavBarPri</nav>,
}));

vi.mock('../../components/nav/NavBarPub', () => ({
  default: () => <nav data-testid="navbar-pub">NavBarPub</nav>,
}));

vi.mock('../../components/pri/message/MessageList', () => ({
  default: () => <div data-testid="message-list">MessageList</div>,
}));

vi.mock('../../hooks/useIntercom', () => ({
  useIntercomMessages: vi.fn(),
}));

vi.mock('../../lib/nav', () => ({
  ping: vi.fn(),
}));

describe('Layout', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  afterEach(() => {
    sessionStorage.clear();
  });

  it('renders without crashing', () => {
    render(<Layout />);
  });

  it('renders Outlet', () => {
    render(<Layout />);
    expect(screen.getByTestId('outlet')).toBeInTheDocument();
  });

  it('renders NavBarPub when not authenticated', () => {
    render(<Layout />);
    expect(screen.getByTestId('navbar-pub')).toBeInTheDocument();
  });

  it('renders NavBarPri when authenticated', () => {
    sessionStorage.setItem('oidc_authenticated', 'ok');
    render(<Layout />);
    expect(screen.getByTestId('navbar-pri')).toBeInTheDocument();
  });

  it('renders MessageList when authenticated', () => {
    sessionStorage.setItem('oidc_authenticated', 'ok');
    render(<Layout />);
    expect(screen.getByTestId('message-list')).toBeInTheDocument();
  });

  it('does not render MessageList when not authenticated', () => {
    render(<Layout />);
    expect(screen.queryByTestId('message-list')).toBeNull();
  });
});
