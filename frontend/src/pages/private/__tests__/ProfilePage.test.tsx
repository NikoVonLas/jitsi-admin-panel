import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import ProfilePage from '../ProfilePage';

vi.mock('react-router-dom', () => ({
  Link: ({ children, to }: { children: React.ReactNode; to: string }) => <a href={to}>{children}</a>,
}));

vi.mock('../../../i18n', () => ({
  useTr: () => (key: string) => key,
}));

vi.mock('../../../lib/api', () => ({
  list: vi.fn().mockResolvedValue([]),
}));

vi.mock('../../../components/common/Spinner', () => ({
  default: () => <div data-testid="spinner">Loading</div>,
}));

vi.mock('../../../components/common/AlertWarning', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div data-testid="alert">{children}</div>,
}));

vi.mock('../../../components/common/Subheader', () => ({
  default: ({ title }: { title: string }) => <div data-testid="subheader">{title}</div>,
}));

vi.mock('../../../components/pri/profile/ProfileListItem', () => ({
  default: ({ profile }: { profile: { id: string; name: string } }) => (
    <div data-testid="profile-item">{profile.name}</div>
  ),
}));

import { list } from '../../../lib/api';

describe('ProfilePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(list).mockResolvedValue([]);
  });

  it('renders without crashing', async () => {
    render(<ProfilePage />);
    await waitFor(() => expect(screen.queryByTestId('spinner')).toBeNull());
  });

  it('renders subheader with profiles title', async () => {
    render(<ProfilePage />);
    await waitFor(() => expect(screen.getByText('page.profiles')).toBeInTheDocument());
  });

  it('shows spinner while loading', () => {
    vi.mocked(list).mockReturnValue(new Promise(() => {}));
    render(<ProfilePage />);
    expect(screen.getByTestId('spinner')).toBeInTheDocument();
  });

  it('shows empty state message when no profiles', async () => {
    vi.mocked(list).mockResolvedValue([]);
    render(<ProfilePage />);
    await waitFor(() => expect(screen.getByText(/no profile/i)).toBeInTheDocument());
  });

  it('renders profile items when profiles exist', async () => {
    vi.mocked(list).mockResolvedValue([
      { id: '1', name: 'Profile One' },
      { id: '2', name: 'Profile Two' },
    ]);
    render(<ProfilePage />);
    await waitFor(() => expect(screen.getAllByTestId('profile-item')).toHaveLength(2));
  });

  it('shows error alert when list fails', async () => {
    vi.mocked(list).mockRejectedValue(new Error('network'));
    render(<ProfilePage />);
    await waitFor(() => expect(screen.getByText('err.generic')).toBeInTheDocument());
  });
});
