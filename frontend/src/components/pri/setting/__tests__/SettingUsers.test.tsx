import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';

vi.mock('../../../../lib/api', () => ({
  list: vi.fn().mockResolvedValue([]),
  action: vi.fn().mockResolvedValue({}),
}));

vi.mock('../../../../i18n', () => {
  const t = (k: string) => k;
  return { useTr: () => t };
});

import * as api from '../../../../lib/api';
import SettingUsers from '../SettingUsers';

interface LocalUser {
  id: string;
  email: string;
  is_superadmin: boolean;
  created_at: string;
}

function makeUser(overrides: Partial<LocalUser> = {}): LocalUser {
  return {
    id: 'user-1',
    email: 'user@example.com',
    is_superadmin: false,
    created_at: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('SettingUsers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(api.list).mockResolvedValue([]);
  });

  it('renders without crashing', () => {
    render(<SettingUsers />);
  });

  it('shows loading state initially', () => {
    vi.mocked(api.list).mockReturnValue(new Promise(() => {}));
    render(<SettingUsers />);
    expect(document.querySelector('.ant-spin')).toBeInTheDocument();
  });

  it('renders table after loading', async () => {
    vi.mocked(api.list).mockResolvedValue([]);
    render(<SettingUsers />);
    await waitFor(() => {
      expect(document.querySelector('.ant-table')).toBeInTheDocument();
    });
  });

  it('renders column headers', async () => {
    vi.mocked(api.list).mockResolvedValue([]);
    render(<SettingUsers />);
    await waitFor(() => {
      expect(screen.getByText('user.email')).toBeInTheDocument();
      expect(screen.getByText('user.is_admin')).toBeInTheDocument();
    });
  });

  it('renders user rows after loading', async () => {
    vi.mocked(api.list).mockResolvedValue([makeUser({ email: 'alice@example.com' })]);
    render(<SettingUsers />);
    await waitFor(() => {
      expect(screen.getByText('alice@example.com')).toBeInTheDocument();
    });
  });

  it('shows empty text when no users', async () => {
    vi.mocked(api.list).mockResolvedValue([]);
    render(<SettingUsers />);
    await waitFor(() => {
      expect(screen.getByText('user.no_users')).toBeInTheDocument();
    });
  });

  it('renders add modal when addOpen is true', () => {
    render(<SettingUsers addOpen={true} />);
    // 'user.add' appears in both the modal title and submit button
    expect(screen.getAllByText('user.add').length).toBeGreaterThan(0);
  });

  it('shows error when API fails', async () => {
    vi.mocked(api.list).mockRejectedValue(new Error('API error'));
    render(<SettingUsers />);
    await waitFor(() => {
      expect(screen.getByText('user.err_del')).toBeInTheDocument();
    });
  });

  it('accepts onAddClose callback', () => {
    const onAddClose = vi.fn();
    render(<SettingUsers addOpen={true} onAddClose={onAddClose} />);
    // Modal renders with title 'user.add' when addOpen=true
    expect(screen.getAllByText('user.add').length).toBeGreaterThan(0);
  });

  it('calls list API on mount', async () => {
    render(<SettingUsers />);
    await waitFor(() => {
      expect(vi.mocked(api.list)).toHaveBeenCalledWith('/api/pri/user/list', 1000);
    });
  });
});
