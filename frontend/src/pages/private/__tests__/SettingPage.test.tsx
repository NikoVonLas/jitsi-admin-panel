import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import SettingPage from '../SettingPage';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

vi.mock('../../../i18n', () => ({
  useTr: () => (key: string) => key,
}));

vi.mock('../../../lib/api', () => ({
  list: vi.fn().mockResolvedValue([]),
}));

vi.mock('../../../store/role', () => ({
  useRoleStore: () => ({ isSuperAdmin: true }),
}));

vi.mock('../../../components/common/Subheader', () => ({
  default: ({ title }: { title: string }) => <div data-testid="subheader">{title}</div>,
}));

vi.mock('../../../components/common/AlertWarning', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div data-testid="alert">{children}</div>,
}));

vi.mock('../../../components/common/Spinner', () => ({
  default: () => <div data-testid="spinner">Loading</div>,
}));

vi.mock('../../../components/pri/domain/DomainList', () => ({
  default: () => <div data-testid="domain-list">DomainList</div>,
}));

vi.mock('../../../components/pri/domain/DomainAdd', () => ({
  default: () => <div>DomainAdd</div>,
}));

vi.mock('../../../components/pri/setting/SettingGeneral', () => ({
  default: () => <div data-testid="setting-general">SettingGeneral</div>,
}));

vi.mock('../../../components/pri/setting/SettingMailer', () => ({
  default: () => <div>SettingMailer</div>,
}));

vi.mock('../../../components/pri/setting/SettingAppearance', () => ({
  default: () => <div>SettingAppearance</div>,
}));

vi.mock('../../../components/pri/setting/SettingAuth', () => ({
  default: () => <div>SettingAuth</div>,
}));

vi.mock('../../../components/pri/setting/SettingUsers', () => ({
  default: () => <div>SettingUsers</div>,
}));

describe('SettingPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockClear();
    globalThis.fetch = vi.fn().mockResolvedValue({
      json: async () => ({ local: true }),
    });
  });

  it('renders without crashing', async () => {
    render(<SettingPage />);
    await waitFor(() => expect(screen.getByTestId('subheader')).toBeInTheDocument());
  });

  it('renders settings title', async () => {
    render(<SettingPage />);
    await waitFor(() => expect(screen.getByText('page.settings')).toBeInTheDocument());
  });

  it('renders general settings tab by default', async () => {
    render(<SettingPage />);
    await waitFor(() => expect(screen.getByTestId('setting-general')).toBeInTheDocument());
  });
});
