import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('react-router-dom', () => ({
  Link: ({ children, to, onClick, style }: { children: React.ReactNode; to: string; onClick?: () => void; style?: React.CSSProperties }) => (
    <a href={to} onClick={onClick} style={style}>{children}</a>
  ),
  useLocation: () => ({ pathname: '/meeting' }),
}));

vi.mock('../../../i18n', () => {
  const t = (k: string) => k;
  return { useTr: () => t };
});

vi.mock('../../../store/role', () => ({
  useRoleStore: vi.fn(() => ({ isSuperAdmin: false })),
}));

vi.mock('../Brand', () => ({
  default: () => <div data-testid="brand">Brand</div>,
}));

vi.mock('../ButtonAccountOidc', () => ({
  default: () => <button data-testid="account-btn">Account</button>,
}));

import { useRoleStore } from '../../../store/role';
import NavBarPri from '../NavBarPri';

describe('NavBarPri', () => {
  afterEach(() => {
    vi.mocked(useRoleStore).mockReturnValue({ isSuperAdmin: false });
  });

  it('renders without crashing', () => {
    render(<NavBarPri />);
  });

  it('renders the brand', () => {
    render(<NavBarPri />);
    expect(screen.getAllByTestId('brand').length).toBeGreaterThan(0);
  });

  it('renders the account button', () => {
    render(<NavBarPri />);
    expect(screen.getAllByTestId('account-btn').length).toBeGreaterThan(0);
  });

  it('renders navigation links', () => {
    render(<NavBarPri />);
    expect(screen.getAllByText('nav.meetings').length).toBeGreaterThan(0);
    expect(screen.getAllByText('nav.rooms').length).toBeGreaterThan(0);
    expect(screen.getAllByText('nav.calendar').length).toBeGreaterThan(0);
  });

  it('does not render settings link when not superadmin', () => {
    render(<NavBarPri />);
    expect(screen.queryByText('nav.settings')).not.toBeInTheDocument();
  });

  it('renders settings link when superadmin', () => {
    vi.mocked(useRoleStore).mockReturnValue({ isSuperAdmin: true });
    render(<NavBarPri />);
    expect(screen.getAllByText('nav.settings').length).toBeGreaterThan(0);
  });

  it('renders a nav element', () => {
    render(<NavBarPri />);
    expect(document.querySelector('nav')).toBeInTheDocument();
  });
});
