import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import ProfileActionPage from '../ProfileActionPage';

vi.mock('react-router-dom', () => ({
  useParams: () => ({ uuid: 'profile-uuid-1' }),
  useNavigate: () => vi.fn(),
}));

vi.mock('../../../../i18n', () => ({
  useTr: () => (key: string) => key,
}));

vi.mock('../../../../lib/api', () => ({
  getById: vi.fn().mockResolvedValue({ id: 'profile-uuid-1', name: 'Test Profile' }),
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

import { getById } from '../../../../lib/api';

describe('ProfileActionPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getById).mockResolvedValue({ id: 'profile-uuid-1', name: 'Test Profile' });
  });

  it('renders without crashing', async () => {
    render(
      <ProfileActionPage title="Test Action">
        {(profile) => <div data-testid="content">{profile.name}</div>}
      </ProfileActionPage>
    );
    await waitFor(() => expect(screen.queryByTestId('spinner')).toBeNull());
  });

  it('renders title in subheader', async () => {
    render(
      <ProfileActionPage title="Test Action Title">
        {() => <div>content</div>}
      </ProfileActionPage>
    );
    expect(screen.getByText('Test Action Title')).toBeInTheDocument();
  });

  it('shows spinner while loading', () => {
    vi.mocked(getById).mockReturnValue(new Promise(() => {}));
    render(
      <ProfileActionPage title="Title">
        {() => <div>content</div>}
      </ProfileActionPage>
    );
    expect(screen.getByTestId('spinner')).toBeInTheDocument();
  });

  it('renders children with profile data', async () => {
    render(
      <ProfileActionPage title="Title">
        {(profile) => <div data-testid="content">{profile.name}</div>}
      </ProfileActionPage>
    );
    await waitFor(() => expect(screen.getByTestId('content')).toHaveTextContent('Test Profile'));
  });

  it('shows error alert when getById fails', async () => {
    vi.mocked(getById).mockRejectedValue(new Error('fail'));
    render(
      <ProfileActionPage title="Title">
        {() => <div>content</div>}
      </ProfileActionPage>
    );
    await waitFor(() => expect(screen.getByTestId('alert')).toBeInTheDocument());
  });
});
