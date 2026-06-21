import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';

vi.mock('../../../../lib/api', () => ({
  action: vi.fn().mockResolvedValue({}),
  listById: vi.fn().mockResolvedValue([]),
}));

vi.mock('../../../../i18n', () => {
  const t = (k: string) => k;
  return { useTr: () => t };
});

// Mock child components to avoid deep rendering
vi.mock('../ScheduleListItem', () => ({
  default: ({ schedule }: { schedule: { id: string } }) => (
    <div data-testid={`schedule-item-${schedule.id}`}>Schedule Item</div>
  ),
}));

vi.mock('../ScheduleFields', () => ({
  default: (_props: unknown, ref: React.Ref<{ normalizeInto: (sa: Record<string, string>) => void }>) => {
    if (ref && typeof ref === 'object' && 'current' in ref) {
      (ref as React.MutableRefObject<unknown>).current = {
        normalizeInto: (_sa: Record<string, string>) => {},
      };
    }
    return <div data-testid="schedule-fields" />;
  },
}));

import * as api from '../../../../lib/api';
import ScheduleModal from '../ScheduleModal';

describe('ScheduleModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(api.listById).mockResolvedValue([]);
  });

  it('renders without crashing', () => {
    render(<ScheduleModal meetingId="meeting-1" />);
  });

  it('renders add schedule button', async () => {
    render(<ScheduleModal meetingId="meeting-1" />);
    await waitFor(() => {
      expect(screen.getByText('btn.add_schedule')).toBeInTheDocument();
    });
  });

  it('shows spinner while loading', () => {
    vi.mocked(api.listById).mockReturnValue(new Promise(() => {}));
    render(<ScheduleModal meetingId="meeting-1" />);
    expect(document.querySelector('.ant-spin')).toBeInTheDocument();
  });

  it('shows no-schedules message when list is empty', async () => {
    vi.mocked(api.listById).mockResolvedValue([]);
    render(<ScheduleModal meetingId="meeting-1" />);
    await waitFor(() => {
      expect(
        screen.getByText('No schedules yet. Add one to get started.'),
      ).toBeInTheDocument();
    });
  });

  it('renders schedule items when schedules are loaded', async () => {
    vi.mocked(api.listById).mockResolvedValue([
      {
        id: 'sched-1',
        meeting_id: 'meeting-1',
        schedule_attr: { type: 'o', started_at: '2026-06-21T10:00:00.000Z', duration: '60' },
        host_key: 'KEY1',
        session_at: '2026-06-21T10:00:00.000Z',
        session_remaining: 1,
        enabled: true,
        created_at: '2026-01-01T00:00:00.000Z',
        updated_at: '2026-01-01T00:00:00.000Z',
      },
    ]);
    render(<ScheduleModal meetingId="meeting-1" />);
    await waitFor(() => {
      expect(screen.getByTestId('schedule-item-sched-1')).toBeInTheDocument();
    });
  });

  it('shows error message when API fails', async () => {
    vi.mocked(api.listById).mockRejectedValue(new Error('Network error'));
    render(<ScheduleModal meetingId="meeting-1" />);
    await waitFor(() => {
      expect(screen.getByText('err.generic')).toBeInTheDocument();
    });
  });

  it('opens add modal when add button is clicked', async () => {
    vi.mocked(api.listById).mockResolvedValue([]);
    render(<ScheduleModal meetingId="meeting-1" />);
    await waitFor(() => {
      expect(screen.getByText('btn.add_schedule')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('btn.add_schedule'));
    await waitFor(() => {
      expect(screen.getByText('page.add_schedule')).toBeInTheDocument();
    });
  });

  it('reloads when meetingId changes', async () => {
    vi.mocked(api.listById).mockResolvedValue([]);
    const { rerender } = render(<ScheduleModal meetingId="meeting-1" />);
    await waitFor(() =>
      expect(vi.mocked(api.listById)).toHaveBeenCalledWith(
        '/api/pri/meeting/schedule/list/bymeeting',
        'meeting-1',
        100,
      ),
    );
    rerender(<ScheduleModal meetingId="meeting-2" />);
    await waitFor(() =>
      expect(vi.mocked(api.listById)).toHaveBeenCalledWith(
        '/api/pri/meeting/schedule/list/bymeeting',
        'meeting-2',
        100,
      ),
    );
  });
});
