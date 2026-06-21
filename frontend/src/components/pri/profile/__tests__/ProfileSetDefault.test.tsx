import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import ProfileSetDefault from '../ProfileSetDefault';
import type { Profile } from '../../../../types';

vi.mock('../../../../i18n', () => ({
  useTr: () => (k: string) => k,
}));

vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
}));

vi.mock('../../../../lib/api', () => ({
  actionById: vi.fn().mockResolvedValue({}),
}));

const profile: Profile = {
  id: 'p1',
  name: 'Bob',
  email: 'bob@example.com',
  avatar_url: '',
  is_default: false,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

describe('ProfileSetDefault', () => {
  it('renders the profile name', () => {
    render(<ProfileSetDefault profile={profile} />);
    expect(screen.getByText('Bob')).toBeInTheDocument();
  });

  it('renders the info alert about setting default', () => {
    render(<ProfileSetDefault profile={profile} />);
    expect(screen.getByText('Set "Bob" as your default profile?')).toBeInTheDocument();
  });

  it('renders the set default button', () => {
    render(<ProfileSetDefault profile={profile} />);
    expect(screen.getByText('btn.set_default_profile')).toBeInTheDocument();
  });

  it('renders cancel button', () => {
    render(<ProfileSetDefault profile={profile} />);
    expect(screen.getByText('btn.cancel')).toBeInTheDocument();
  });
});
