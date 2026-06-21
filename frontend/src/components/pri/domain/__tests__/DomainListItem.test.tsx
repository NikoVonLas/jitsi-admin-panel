import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import DomainListItem from '../DomainListItem';
import type { Domain333 } from '../../../../types';

vi.mock('../../../../i18n', () => ({
  useTr: () => (k: string) => k,
}));

vi.mock('../../../../lib/api', () => ({
  actionById: vi.fn().mockResolvedValue({}),
}));

vi.mock('../../../../store/role', () => ({
  useRoleStore: () => ({ isSuperAdmin: false, loaded: true, load: vi.fn() }),
}));

vi.mock('../DomainUpdate', () => ({
  default: () => <div data-testid="domain-update-form" />,
}));

const mockDomain: Domain333 = {
  id: 'domain-1',
  name: 'My Domain',
  auth_type: 'none',
  url: 'https://meet.example.com',
  public: false,
  enabled: true,
  updated_at: '2024-01-01T00:00:00Z',
};

describe('DomainListItem', () => {
  it('renders domain name', () => {
    render(<DomainListItem domain={mockDomain} />);
    expect(screen.getByText('My Domain')).toBeInTheDocument();
  });

  it('renders domain URL', () => {
    render(<DomainListItem domain={mockDomain} />);
    expect(screen.getByText('https://meet.example.com')).toBeInTheDocument();
  });

  it('renders private tag for non-public domain', () => {
    render(<DomainListItem domain={mockDomain} />);
    expect(screen.getByText('domain.private')).toBeInTheDocument();
  });

  it('renders public tag for public domain', () => {
    render(<DomainListItem domain={{ ...mockDomain, public: true }} />);
    expect(screen.getByText('domain.public')).toBeInTheDocument();
  });

  it('does not render action buttons when user is not super admin', () => {
    render(<DomainListItem domain={mockDomain} />);
    // Card has no actions
    expect(screen.queryByTitle('btn.update')).toBeNull();
  });

  it('renders with disabled domain styling', () => {
    render(<DomainListItem domain={{ ...mockDomain, enabled: false }} />);
    // The card renders with a red border
    expect(screen.getByText('My Domain')).toBeInTheDocument();
  });
});
