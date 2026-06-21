import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import ProfileDel from '../ProfileDel';
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
  name: 'Alice',
  email: 'alice@example.com',
  avatar_url: '',
  is_default: false,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

describe('ProfileDel', () => {
  it('renders the profile name', () => {
    render(<ProfileDel profile={profile} />);
    expect(screen.getByText('Alice')).toBeInTheDocument();
  });

  it('renders delete warning alert', () => {
    render(<ProfileDel profile={profile} />);
    expect(screen.getByText('warn.delete_profile')).toBeInTheDocument();
  });

  it('renders delete submit button', () => {
    render(<ProfileDel profile={profile} />);
    expect(screen.getByText('btn.delete')).toBeInTheDocument();
  });

  it('renders cancel button', () => {
    render(<ProfileDel profile={profile} />);
    expect(screen.getByText('btn.cancel')).toBeInTheDocument();
  });
});
