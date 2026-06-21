import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import ProfileUpdatePage from '../ProfileUpdatePage';

vi.mock('react-router-dom', () => ({
  useParams: () => ({ uuid: 'profile-uuid-upd' }),
  useNavigate: () => vi.fn(),
}));

vi.mock('../../../../i18n', () => ({
  useTr: () => (key: string) => key,
}));

vi.mock('../../../../lib/api', () => ({
  getById: vi.fn().mockResolvedValue({ id: 'profile-uuid-upd', name: 'Update Me' }),
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

vi.mock('../../../../components/pri/profile/ProfileUpdate', () => ({
  default: ({ profile }: { profile: { name: string } }) => (
    <div data-testid="profile-update">{profile.name}</div>
  ),
}));

describe('ProfileUpdatePage', () => {
  it('renders without crashing', async () => {
    render(<ProfileUpdatePage />);
    await waitFor(() => expect(screen.queryByTestId('spinner')).toBeNull());
  });

  it('renders update profile title in subheader', async () => {
    render(<ProfileUpdatePage />);
    expect(screen.getByText('page.update_profile')).toBeInTheDocument();
  });

  it('renders ProfileUpdate component with profile', async () => {
    render(<ProfileUpdatePage />);
    await waitFor(() => expect(screen.getByTestId('profile-update')).toBeInTheDocument());
    expect(screen.getByText('Update Me')).toBeInTheDocument();
  });
});
