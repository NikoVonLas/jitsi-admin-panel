import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import DomainFields, { getDefaultDomainAttr } from '../DomainFields';

vi.mock('../../../../i18n', () => ({
  useTr: () => (k: string) => k,
}));

vi.mock('../../../../lib/config', () => ({
  TOKEN_ALGO: 'HS256',
}));

const defaultAttr = getDefaultDomainAttr();

const defaultProps = {
  name: '',
  onNameChange: vi.fn(),
  authType: 'none',
  onAuthTypeChange: vi.fn(),
  domainAttr: defaultAttr,
  onDomainAttrChange: vi.fn(),
  isPublic: false,
  onPublicChange: vi.fn(),
};

describe('DomainFields', () => {
  it('renders the name field', () => {
    render(<DomainFields {...defaultProps} />);
    expect(screen.getByText('form.name')).toBeInTheDocument();
  });

  it('renders the URL field for auth type none', () => {
    render(<DomainFields {...defaultProps} />);
    expect(screen.getByText('form.url')).toBeInTheDocument();
  });

  it('renders auth type radio buttons', () => {
    render(<DomainFields {...defaultProps} />);
    expect(screen.getByText('domain.auth_none')).toBeInTheDocument();
    expect(screen.getByText('domain.auth_token')).toBeInTheDocument();
  });

  it('renders public access switch', () => {
    render(<DomainFields {...defaultProps} />);
    expect(screen.getByText('domain.public_access')).toBeInTheDocument();
  });

  it('renders token fields when authType is token', () => {
    render(<DomainFields {...defaultProps} authType="token" />);
    expect(screen.getByText('form.app_id')).toBeInTheDocument();
    expect(screen.getByText('form.app_secret')).toBeInTheDocument();
  });

  it('does not render app_id when authType is none', () => {
    render(<DomainFields {...defaultProps} authType="none" />);
    expect(screen.queryByText('form.app_id')).toBeNull();
  });
});

describe('getDefaultDomainAttr', () => {
  it('returns an object with all required keys', () => {
    const attr = getDefaultDomainAttr();
    expect(attr).toHaveProperty('url');
    expect(attr).toHaveProperty('app_id');
    expect(attr).toHaveProperty('app_secret');
    expect(attr).toHaveProperty('app_alg');
  });
});
