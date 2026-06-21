import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('../../../i18n', () => {
  const t = (k: string) => k;
  return { useTr: () => t };
});

vi.mock('../Brand', () => ({
  default: () => <div data-testid="brand">Brand</div>,
}));

import NavBarPub from '../NavBarPub';

describe('NavBarPub', () => {
  it('renders without crashing', () => {
    render(<NavBarPub />);
  });

  it('renders a nav element', () => {
    render(<NavBarPub />);
    expect(document.querySelector('nav')).toBeInTheDocument();
  });

  it('renders the brand', () => {
    render(<NavBarPub />);
    expect(screen.getByTestId('brand')).toBeInTheDocument();
  });

  it('renders the sign in button', () => {
    render(<NavBarPub />);
    expect(screen.getByText('btn.sign_in')).toBeInTheDocument();
  });

  it('sign in button links to OIDC redirect endpoint', () => {
    render(<NavBarPub />);
    const btn = screen.getByText('btn.sign_in').closest('a');
    expect(btn).toHaveAttribute('href', '/api/adm/oidc/redirect?prompt=consent');
  });
});
