import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import ProfileUpdate from '../ProfileUpdate';
import type { Profile } from '../../../../types';

vi.mock('../../../../i18n', () => ({
  useTr: () => (k: string) => k,
}));

vi.mock('../../../../lib/api', () => ({
  action: vi.fn().mockResolvedValue({ id: 'p1' }),
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

describe('ProfileUpdate', () => {
  it('renders the display name field', () => {
    render(<ProfileUpdate profile={profile} />);
    expect(screen.getByText('form.display_name')).toBeInTheDocument();
  });

  it('renders the name input with current value', () => {
    render(<ProfileUpdate profile={profile} />);
    expect(screen.getByDisplayValue('Alice')).toBeInTheDocument();
  });

  it('renders avatar initials when no avatar_url', () => {
    render(<ProfileUpdate profile={profile} />);
    expect(screen.getByText('A')).toBeInTheDocument();
  });

  it('renders avatar image when avatar_url set', () => {
    render(<ProfileUpdate profile={{ ...profile, avatar_url: '/avatar.png' }} />);
    expect(document.querySelector('img[alt="avatar"]')).toBeInTheDocument();
  });

  it('renders remove avatar button when avatar_url set', () => {
    render(<ProfileUpdate profile={{ ...profile, avatar_url: '/avatar.png' }} />);
    expect(screen.getByText('form.avatar_remove')).toBeInTheDocument();
  });

  it('does not render remove avatar button when no avatar_url', () => {
    render(<ProfileUpdate profile={profile} />);
    expect(screen.queryByText('form.avatar_remove')).toBeNull();
  });

  it('renders hidden file input for avatar upload', () => {
    render(<ProfileUpdate profile={profile} />);
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    expect(input).toBeInTheDocument();
    expect(input.style.display).toBe('none');
  });
});
