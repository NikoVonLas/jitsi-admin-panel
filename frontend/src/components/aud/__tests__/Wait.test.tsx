import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import Wait from '../Wait';
import type { MeetingSchedule111 } from '../../../types';

const mockNavigate = vi.fn();

vi.mock('../../../i18n', () => ({
  useTr: () => (k: string) => k,
  useI18n: () => ({ lang: 'en', setLang: () => {}, t: (k: string) => k }),
}));

vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

vi.mock('../../../lib/api', () => ({
  getByCode: vi.fn().mockResolvedValue({}),
}));

vi.mock('../../../lib/common', () => ({
  epochToIntervalString: (_s: number) => '00:05:00',
  showLocaleDatetime: (_v: string, _lang: string) => 'Jan 1, 2024 10:00 AM',
}));

const schedule: MeetingSchedule111 = {
  code: 'ABC123',
  meeting_name: 'Team Standup',
  meeting_info: 'Daily standup meeting',
  started_at: new Date(Date.now() + 600000).toISOString(), // 10 minutes from now
  ended_at: new Date(Date.now() + 4200000).toISOString(),
  duration: 60,
  waiting_time: 600,
  join_as: 'guest',
};

describe('Wait', () => {
  it('renders the meeting name', () => {
    render(<Wait schedule={schedule} />);
    expect(screen.getByText('Team Standup')).toBeInTheDocument();
  });

  it('renders the meeting info', () => {
    render(<Wait schedule={schedule} />);
    expect(screen.getByText('Daily standup meeting')).toBeInTheDocument();
  });

  it('renders the remaining time', () => {
    render(<Wait schedule={schedule} />);
    expect(screen.getByText('00:05:00')).toBeInTheDocument();
  });

  it('renders cancel button', () => {
    render(<Wait schedule={schedule} />);
    expect(screen.getByText('btn.cancel')).toBeInTheDocument();
  });

  it('renders join now button when join_as is host', () => {
    render(<Wait schedule={{ ...schedule, join_as: 'host' }} />);
    expect(screen.getByText('btn.join_now')).toBeInTheDocument();
  });

  it('does not render join now button for guests', () => {
    render(<Wait schedule={schedule} />);
    expect(screen.queryByText('btn.join_now')).toBeNull();
  });

  it('renders formatted start datetime', () => {
    render(<Wait schedule={schedule} />);
    expect(screen.getByText('Jan 1, 2024 10:00 AM')).toBeInTheDocument();
  });

  it('navigates to / when cancel is clicked', () => {
    render(<Wait schedule={schedule} />);
    screen.getByText('btn.cancel').closest('button')?.click();
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });
});
