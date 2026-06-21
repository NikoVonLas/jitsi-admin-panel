import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

vi.mock('../../../../i18n', () => {
  const t = (k: string) => k;
  return {
    useTr: () => t,
    useI18n: () => ({ lang: 'en', setLang: () => {}, t }),
  };
});

vi.mock('../../../../lib/common', () => ({
  dateAfterXDays: vi.fn().mockReturnValue('2026-09-20'),
  getDuration: vi.fn().mockReturnValue(30),
  getEndTime: vi.fn().mockReturnValue('11:00'),
  getLastDayOfWeek: vi.fn().mockReturnValue('2026-09-20'),
  getToday: vi.fn().mockReturnValue('2026-06-21'),
  isAllDay: vi.fn().mockReturnValue(false),
  isOver: vi.fn().mockReturnValue(false),
  toLocaleDate: vi.fn().mockImplementation((v: string) => v.slice(0, 10)),
  toLocaleTime: vi.fn().mockReturnValue('10:00'),
}));

import ScheduleFields from '../ScheduleFields';

describe('ScheduleFields', () => {
  it('renders without crashing', () => {
    render(<ScheduleFields />);
  });

  it('renders schedule type radio group when not editing', () => {
    render(<ScheduleFields />);
    // Once type radio buttons should be present
    expect(screen.getByText('sched.once')).toBeInTheDocument();
    expect(screen.getByText('sched.daily')).toBeInTheDocument();
    expect(screen.getByText('sched.weekly')).toBeInTheDocument();
    expect(screen.getByText('sched.custom')).toBeInTheDocument();
  });

  it('does not render type radio group when editing (initial prop provided)', () => {
    const initial = {
      type: 'o',
      started_at: '2026-06-21T10:00:00.000Z',
      duration: '60',
    };
    render(<ScheduleFields initial={initial} />);
    // In edit mode the radio group is hidden
    expect(screen.queryByText('sched.once')).not.toBeInTheDocument();
  });

  it('renders date field for once type by default', () => {
    render(<ScheduleFields />);
    expect(screen.getByText('form.date')).toBeInTheDocument();
  });

  it('renders all_day switch', () => {
    render(<ScheduleFields />);
    expect(screen.getByText('form.all_day')).toBeInTheDocument();
  });

  it('renders start and end time fields when not all-day', () => {
    render(<ScheduleFields />);
    expect(screen.getByText('form.start_time')).toBeInTheDocument();
    expect(screen.getByText('form.end_time')).toBeInTheDocument();
  });

  it('renders daily fields when daily type is selected', () => {
    render(<ScheduleFields />);
    // Click the 'sched.daily' radio button
    const dailyBtn = screen.getByText('sched.daily');
    fireEvent.click(dailyBtn);
    expect(screen.getByText('form.from')).toBeInTheDocument();
    expect(screen.getByText('form.every_days')).toBeInTheDocument();
  });

  it('renders weekly fields when weekly type is selected', () => {
    render(<ScheduleFields />);
    const weeklyBtn = screen.getByText('sched.weekly');
    fireEvent.click(weeklyBtn);
    expect(screen.getByText('form.every_weeks')).toBeInTheDocument();
  });

  it('renders monthly fields when monthly type is selected', () => {
    render(<ScheduleFields />);
    const monthlyBtn = screen.getByText('sched.custom');
    fireEvent.click(monthlyBtn);
    expect(screen.getByText('form.every_months')).toBeInTheDocument();
  });

  it('renders with initial edit data', () => {
    const initial = {
      type: 'd',
      started_at: '2026-06-21T10:00:00.000Z',
      duration: '30',
      rep_every: '1',
      rep_end_type: 'forever',
    };
    render(<ScheduleFields initial={initial} />);
    // Edit mode: no type selector, but should render daily fields
    expect(screen.getByText('form.from')).toBeInTheDocument();
  });

  it('renders from/to date fields for weekly initial', () => {
    const initial = {
      type: 'w',
      started_at: '2026-06-21T10:00:00.000Z',
      duration: '60',
      rep_every: '1',
      rep_days: '0111110',
      rep_end_at: '2026-09-20T23:59:59.000Z',
    };
    render(<ScheduleFields initial={initial} />);
    expect(screen.getByText('form.from')).toBeInTheDocument();
    expect(screen.getByText('form.to')).toBeInTheDocument();
  });
});
