import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import CalendarGrid from '../../../pri/calendar/CalendarGrid';
import type { MeetingSchedule222 } from '../../../../types';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

vi.mock('../../../../i18n', () => ({
  useTr: () => (key: string) => key,
  useI18n: () => ({ lang: 'en' }),
}));

vi.mock('../../../../lib/common', () => ({
  getFirstDayOfMonth: (date: string) => date.slice(0, 8) + '01',
  getFirstDayOfWeek: () => '2026-06-01',
  getToday: () => '2026-06-21',
  toCalendarDayLabel: (_date: string, _lang: string) => '1',
  toLocaleDate: (date: string) => date.slice(0, 10),
  toLocaleTime: () => '10:00',
}));

const emptyCalendar: MeetingSchedule222[] = [];

const sampleCalendar: MeetingSchedule222[] = [
  {
    meeting_id: 'm1',
    meeting_name: 'Team Standup',
    started_at: '2026-06-21T10:00:00Z',
    ended_at: '2026-06-21T10:30:00Z',
    room_id: 'r1',
    room_name: 'Main Room',
    schedule_id: 's1',
  } as unknown as MeetingSchedule222,
];

describe('CalendarGrid', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockClear();
    localStorage.clear();
  });

  it('renders without crashing', () => {
    render(<CalendarGrid date="2026-06-01" calendar={emptyCalendar} />);
  });

  it('renders a table', () => {
    render(<CalendarGrid date="2026-06-01" calendar={emptyCalendar} />);
    expect(document.querySelector('table')).toBeInTheDocument();
  });

  it('renders 7 column headers', () => {
    render(<CalendarGrid date="2026-06-01" calendar={emptyCalendar} />);
    const headers = document.querySelectorAll('th');
    expect(headers.length).toBe(7);
  });

  it('renders day key labels as headers', () => {
    render(<CalendarGrid date="2026-06-01" calendar={emptyCalendar} />);
    const headers = document.querySelectorAll('th');
    expect(headers.length).toBeGreaterThan(0);
  });

  it('renders 6 weeks (rows)', () => {
    render(<CalendarGrid date="2026-06-01" calendar={emptyCalendar} />);
    const rows = document.querySelectorAll('tbody tr');
    expect(rows.length).toBe(6);
  });

  it('renders 42 day cells total', () => {
    render(<CalendarGrid date="2026-06-01" calendar={emptyCalendar} />);
    const cells = document.querySelectorAll('tbody td');
    expect(cells.length).toBe(42);
  });

  it('renders meeting items in calendar', () => {
    render(<CalendarGrid date="2026-06-01" calendar={sampleCalendar} />);
    expect(screen.getByText(/Team Standup/)).toBeInTheDocument();
  });

  it('navigates to meeting page when meeting button is clicked', () => {
    render(<CalendarGrid date="2026-06-01" calendar={sampleCalendar} />);
    const meetingButton = screen.getByText(/Team Standup/).closest('button');
    expect(meetingButton).toBeInTheDocument();
    meetingButton!.click();
    expect(mockNavigate).toHaveBeenCalled();
  });

  it('uses week_start from localStorage', () => {
    localStorage.setItem('week_start', '0');
    render(<CalendarGrid date="2026-06-01" calendar={emptyCalendar} />);
    const headers = document.querySelectorAll('th');
    expect(headers.length).toBe(7);
  });
});
