import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ProfileConfirmAction from '../ProfileConfirmAction';
import type { Profile } from '../../../../types';

const mockNavigate = vi.fn();

vi.mock('../../../../i18n', () => ({
  useTr: () => (k: string) => k,
}));

vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
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

describe('ProfileConfirmAction', () => {
  it('renders the profile name', () => {
    render(
      <ProfileConfirmAction
        profile={profile}
        endpoint="/api/pri/profile/del"
        alertNode={<div>Alert message</div>}
        errorNode={<div>Error message</div>}
        submitLabel="Delete"
      />,
    );
    expect(screen.getByText('Alice')).toBeInTheDocument();
  });

  it('renders the alert node initially', () => {
    render(
      <ProfileConfirmAction
        profile={profile}
        endpoint="/api/pri/profile/del"
        alertNode={<div>Alert message</div>}
        errorNode={<div>Error message</div>}
        submitLabel="Delete"
      />,
    );
    expect(screen.getByText('Alert message')).toBeInTheDocument();
  });

  it('renders the submit button with provided label', () => {
    render(
      <ProfileConfirmAction
        profile={profile}
        endpoint="/api/pri/profile/del"
        alertNode={<div>Alert</div>}
        errorNode={<div>Error</div>}
        submitLabel="Confirm Delete"
      />,
    );
    expect(screen.getByText('Confirm Delete')).toBeInTheDocument();
  });

  it('renders cancel button', () => {
    render(
      <ProfileConfirmAction
        profile={profile}
        endpoint="/api/pri/profile/del"
        alertNode={<div>Alert</div>}
        errorNode={<div>Error</div>}
        submitLabel="Delete"
      />,
    );
    expect(screen.getByText('btn.cancel')).toBeInTheDocument();
  });

  it('navigates to /profile on submit success', async () => {
    render(
      <ProfileConfirmAction
        profile={profile}
        endpoint="/api/pri/profile/del"
        alertNode={<div>Alert</div>}
        errorNode={<div>Error</div>}
        submitLabel="Delete"
      />,
    );
    fireEvent.click(screen.getByText('Delete'));
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/profile');
    });
  });

  it('navigates to /profile when cancel clicked', () => {
    render(
      <ProfileConfirmAction
        profile={profile}
        endpoint="/api/pri/profile/del"
        alertNode={<div>Alert</div>}
        errorNode={<div>Error</div>}
        submitLabel="Delete"
      />,
    );
    fireEvent.click(screen.getByText('btn.cancel'));
    expect(mockNavigate).toHaveBeenCalledWith('/profile');
  });
});
