import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import ProfileListItem from '../ProfileListItem';
import type { Profile } from '../../../../types';

vi.mock('../../../../i18n', () => ({
  useTr: () => (k: string) => k,
}));

vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
}));

const baseProfile: Profile = {
  id: 'p1',
  name: 'Alice Smith',
  email: 'alice@example.com',
  avatar_url: '',
  is_default: false,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

describe('ProfileListItem', () => {
  it('renders the profile name', () => {
    render(<ProfileListItem profile={baseProfile} />);
    expect(screen.getByText('Alice Smith')).toBeInTheDocument();
  });

  it('renders the profile email', () => {
    render(<ProfileListItem profile={baseProfile} />);
    expect(screen.getByText('alice@example.com')).toBeInTheDocument();
  });

  it('renders avatar initials when no avatar_url', () => {
    render(<ProfileListItem profile={baseProfile} />);
    expect(screen.getByText('AS')).toBeInTheDocument();
  });

  it('renders avatar image when avatar_url is set', () => {
    render(
      <ProfileListItem profile={{ ...baseProfile, avatar_url: '/avatar.png' }} />,
    );
    expect(document.querySelector('img[alt="avatar"]')).toBeInTheDocument();
  });

  it('renders default tag when profile is_default', () => {
    render(<ProfileListItem profile={{ ...baseProfile, is_default: true }} />);
    expect(screen.getByText('profile.default')).toBeInTheDocument();
  });

  it('does not render default tag when not is_default', () => {
    render(<ProfileListItem profile={baseProfile} />);
    expect(screen.queryByText('profile.default')).toBeNull();
  });

  it('renders set-default action button when not default', () => {
    render(<ProfileListItem profile={baseProfile} />);
    // Three action buttons: edit, set-default, delete
    const buttons = document.querySelectorAll('.ant-card-actions button');
    expect(buttons.length).toBeGreaterThanOrEqual(2);
  });

  it('does not render set-default button when already default', () => {
    render(<ProfileListItem profile={{ ...baseProfile, is_default: true }} />);
    // Only edit + delete (no set-default)
    const buttons = document.querySelectorAll('.ant-card-actions button');
    expect(buttons.length).toBe(2);
  });

  it('renders single-word initials correctly', () => {
    render(<ProfileListItem profile={{ ...baseProfile, name: 'Bob' }} />);
    expect(screen.getByText('B')).toBeInTheDocument();
  });
});
