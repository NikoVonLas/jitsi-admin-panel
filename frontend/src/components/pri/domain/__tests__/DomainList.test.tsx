import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import DomainList from '../DomainList';
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

const domains: Domain333[] = [
  {
    id: 'd1',
    name: 'Domain Alpha',
    auth_type: 'none',
    url: 'https://alpha.example.com',
    public: false,
    enabled: true,
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'd2',
    name: 'Domain Beta',
    auth_type: 'token',
    url: 'https://beta.example.com',
    public: true,
    enabled: false,
    updated_at: '2024-02-01T00:00:00Z',
  },
];

describe('DomainList', () => {
  it('renders empty state when no domains', () => {
    render(<DomainList domains={[]} />);
    expect(screen.getByText(/empty\.domains/)).toBeInTheDocument();
  });

  it('renders all domain items', () => {
    render(<DomainList domains={domains} />);
    expect(screen.getByText('Domain Alpha')).toBeInTheDocument();
    expect(screen.getByText('Domain Beta')).toBeInTheDocument();
  });

  it('renders card grid when domains provided', () => {
    const { container } = render(<DomainList domains={domains} />);
    expect(container.querySelector('.card-grid')).toBeInTheDocument();
  });

  it('does not render card grid when empty', () => {
    const { container } = render(<DomainList domains={[]} />);
    expect(container.querySelector('.card-grid')).toBeNull();
  });
});
