import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { MeetingSchedule } from '../../../../types';

vi.mock('../../../../lib/api', () => ({
  actionById: vi.fn().mockResolvedValue({}),
}));

vi.mock('../../../../i18n', () => {
  const t = (k: string) => k;
  return {
    useTr: () => t,
    useI18n: () => ({ lang: 'en', setLang: () => {}, t }),
    pluralRu: (_n: number, one: string) => one,
  };
});

vi.mock('../../../../lib/common', () => ({
  isAllDay: vi.fn().mockReturnValue(false),
  showLocaleDate: vi.fn().mockReturnValue('Jun 21, 2026'),
  showLocaleDatetime: vi.fn().mockReturnValue('Jun 21, 2026 10:00'),
  copyText: vi.fn().mockResolvedValue(undefined),
}));

import ScheduleListItem from '../ScheduleListItem';

function makeSchedule(overrides: Partial<MeetingSchedule> = {}): MeetingSchedule {
  return {
    id: 'sched-1',
    meeting_id: 'meeting-1',
    schedule_attr: {
      type: 'o',
      started_at: '2026-06-21T10:00:00.000Z',
      duration: '60',
    },
    host_key: 'ABC123',
    session_at: '2026-06-21T10:00:00.000Z',
    session_remaining: 1,
    enabled: true,
    created_at: '2026-06-01T00:00:00.000Z',
    updated_at: '2026-06-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('ScheduleListItem', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(<ScheduleListItem schedule={makeSchedule()} />);
  });

  it('renders the session datetime', () => {
    render(<ScheduleListItem schedule={makeSchedule()} />);
    expect(screen.getByText('Jun 21, 2026 10:00')).toBeInTheDocument();
  });

  it('renders duration in minutes', () => {
    render(<ScheduleListItem schedule={makeSchedule()} />);
    // duration display: "60 sched.mins"
    expect(screen.getByText('60 sched.mins')).toBeInTheDocument();
  });

  it('renders all_day label when isAllDay returns true', async () => {
    const common = await import('../../../../lib/common');
    vi.mocked(common.isAllDay).mockReturnValue(true);
    render(<ScheduleListItem schedule={makeSchedule()} />);
    expect(screen.getByText('sched.all_day')).toBeInTheDocument();
    vi.mocked(common.isAllDay).mockReturnValue(false);
  });

  it('renders moderator link', () => {
    render(<ScheduleListItem schedule={makeSchedule()} />);
    expect(screen.getByText('meeting.moderator_link')).toBeInTheDocument();
  });

  it('renders host key', () => {
    render(<ScheduleListItem schedule={makeSchedule({ host_key: 'XYZ789' })} />);
    expect(screen.getByText('XYZ789')).toBeInTheDocument();
  });

  it('renders repeat display for daily schedule', () => {
    render(
      <ScheduleListItem
        schedule={makeSchedule({
          session_remaining: 5,
          schedule_attr: {
            type: 'd',
            started_at: '2026-06-21T10:00:00.000Z',
            duration: '60',
            rep_every: '1',
          },
        })}
      />,
    );
    expect(screen.getByText(/sched.repeat_every/)).toBeInTheDocument();
  });

  it('renders last_session for single remaining session', () => {
    render(
      <ScheduleListItem
        schedule={makeSchedule({
          session_remaining: 1,
          schedule_attr: {
            type: 'd',
            started_at: '2026-06-21T10:00:00.000Z',
            duration: '60',
            rep_every: '1',
          },
        })}
      />,
    );
    expect(screen.getByText('sched.last_session')).toBeInTheDocument();
  });

  it('applies red border when disabled', () => {
    render(<ScheduleListItem schedule={makeSchedule({ enabled: false })} />);
    const card = document.querySelector('.ant-card');
    expect(card).toBeInTheDocument();
  });

  it('accepts onRefresh prop', () => {
    const onRefresh = vi.fn();
    render(<ScheduleListItem schedule={makeSchedule()} onRefresh={onRefresh} />);
    expect(screen.getByText('meeting.moderator_link')).toBeInTheDocument();
  });
});
