import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import CalendarMonthPage from '../CalendarMonthPage';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', () => ({
  useParams: () => ({ date: '2026-06-01' }),
  useNavigate: () => mockNavigate,
}));

vi.mock('../../../../i18n', () => ({
  useTr: () => (key: string) => key,
  useI18n: () => ({ lang: 'en' }),
}));

vi.mock('../../../../lib/api', () => ({
  get: vi.fn().mockResolvedValue({ token: 'sync-token-123' }),
  action: vi.fn().mockResolvedValue({ token: 'new-token' }),
  listByValue: vi.fn().mockResolvedValue([]),
}));

vi.mock('../../../../lib/common', () => ({
  getDayOfNextMonth: () => '2026-07-01',
  getDayOfPreviousMonth: () => '2026-05-01',
  getToday: () => '2026-06-21',
  toLocaleDate: (d: string) => d,
  toLocaleMonthNameLong: () => 'June',
  toLocaleTime: () => '10:00',
  copyText: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../../../../components/common/Subheader', () => ({
  default: ({ title }: { title: string }) => <div data-testid="subheader">{title}</div>,
}));

vi.mock('../../../../components/common/AlertWarning', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div data-testid="alert">{children}</div>,
}));

vi.mock('../../../../components/common/Spinner', () => ({
  default: () => <div data-testid="spinner">Loading</div>,
}));

vi.mock('../../../../components/pri/calendar/CalendarGrid', () => ({
  default: ({ date }: { date: string }) => <div data-testid="calendar-grid">{date}</div>,
}));

vi.mock('../../../../components/pri/meeting/MeetingAdd', () => ({
  default: () => <div>MeetingAdd</div>,
}));

import { listByValue } from '../../../../lib/api';

describe('CalendarMonthPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockClear();
    vi.mocked(listByValue).mockResolvedValue([]);
  });

  it('renders without crashing', async () => {
    render(<CalendarMonthPage />);
    await waitFor(() => expect(screen.queryByTestId('spinner')).toBeNull());
  });

  it('renders subheader with month name', async () => {
    render(<CalendarMonthPage />);
    await waitFor(() => expect(screen.getByTestId('subheader')).toBeInTheDocument());
  });

  it('renders calendar grid after loading', async () => {
    render(<CalendarMonthPage />);
    await waitFor(() => expect(screen.getByTestId('calendar-grid')).toBeInTheDocument());
  });

  it('shows error alert when listByValue fails', async () => {
    vi.mocked(listByValue).mockRejectedValue(new Error('fail'));
    render(<CalendarMonthPage />);
    await waitFor(() => expect(screen.getByTestId('alert')).toBeInTheDocument());
  });
});
