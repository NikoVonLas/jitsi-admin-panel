import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import ProfileSetDefaultPage from '../ProfileSetDefaultPage';

vi.mock('react-router-dom', () => ({
  useParams: () => ({ uuid: 'profile-uuid-sd' }),
  useNavigate: () => vi.fn(),
}));

vi.mock('../../../../i18n', () => ({
  useTr: () => (key: string) => key,
}));

vi.mock('../../../../lib/api', () => ({
  getById: vi.fn().mockResolvedValue({ id: 'profile-uuid-sd', name: 'Default Profile' }),
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

vi.mock('../../../../components/pri/profile/ProfileSetDefault', () => ({
  default: ({ profile }: { profile: { name: string } }) => (
    <div data-testid="profile-set-default">{profile.name}</div>
  ),
}));

describe('ProfileSetDefaultPage', () => {
  it('renders without crashing', async () => {
    render(<ProfileSetDefaultPage />);
    await waitFor(() => expect(screen.queryByTestId('spinner')).toBeNull());
  });

  it('renders set default title in subheader', async () => {
    render(<ProfileSetDefaultPage />);
    expect(screen.getByText('page.set_default_profile')).toBeInTheDocument();
  });

  it('renders ProfileSetDefault component with profile', async () => {
    render(<ProfileSetDefaultPage />);
    await waitFor(() => expect(screen.getByTestId('profile-set-default')).toBeInTheDocument());
    expect(screen.getByText('Default Profile')).toBeInTheDocument();
  });
});
