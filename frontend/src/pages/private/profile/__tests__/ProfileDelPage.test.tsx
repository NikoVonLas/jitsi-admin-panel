import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import ProfileDelPage from '../ProfileDelPage';

vi.mock('react-router-dom', () => ({
  useParams: () => ({ uuid: 'profile-uuid-del' }),
  useNavigate: () => vi.fn(),
}));

vi.mock('../../../../i18n', () => ({
  useTr: () => (key: string) => key,
}));

vi.mock('../../../../lib/api', () => ({
  getById: vi.fn().mockResolvedValue({ id: 'profile-uuid-del', name: 'Profile to Delete' }),
}));

vi.mock('../../../../components/common/Spinner', () => ({
  default: () => <div data-testid="spinner">Loading</div>,
}));

vi.mock('../../../../components/common/AlertWarning', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div data-testid="alert">{children}</div>,
}));

vi.mock('../../../../components/common/SubheaderCenter', () => ({
  default: ({ title }: { title: string }) => <div data-testid="subheader-center">{title}</div>,
}));

vi.mock('../../../../components/pri/profile/ProfileDel', () => ({
  default: ({ profile }: { profile: { name: string } }) => (
    <div data-testid="profile-del">{profile.name}</div>
  ),
}));

describe('ProfileDelPage', () => {
  it('renders without crashing', async () => {
    render(<ProfileDelPage />);
    await waitFor(() => expect(screen.queryByTestId('spinner')).toBeNull());
  });

  it('renders delete title in subheader', async () => {
    render(<ProfileDelPage />);
    expect(screen.getByText('page.del_profile')).toBeInTheDocument();
  });

  it('renders ProfileDel component with profile', async () => {
    render(<ProfileDelPage />);
    await waitFor(() => expect(screen.getByTestId('profile-del')).toBeInTheDocument());
    expect(screen.getByText('Profile to Delete')).toBeInTheDocument();
  });
});
