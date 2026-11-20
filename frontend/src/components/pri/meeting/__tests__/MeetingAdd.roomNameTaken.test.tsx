import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import MeetingAdd from '../MeetingAdd';
import { action } from '../../../../lib/api';
import { ApiError } from '../../../../lib/apiError';

vi.mock('../../../../i18n', () => ({
  useTr: () => (k: string) => k,
}));

vi.mock('../../../../lib/api', () => ({
  action: vi.fn(),
  get: vi.fn().mockResolvedValue({ id: 'p1', name: 'Alice', email: 'alice@example.com' }),
  listFiltered: vi.fn().mockResolvedValue({ items: [], total: 0 }),
  list: vi.fn().mockResolvedValue({ items: [] }),
}));

vi.mock('../../meeting-schedule/ScheduleFields', async () => {
  const React = await import('react');
  return {
    default: React.forwardRef((_props: object, ref: React.Ref<unknown>) => {
      React.useImperativeHandle(ref, () => ({
        normalizeInto: (sa: Record<string, string>) => {
          sa.type = 'o';
          sa.started_at = '2030-01-01T10:00:00.000Z';
          sa.duration = '60';
        },
      }));
      return <div data-testid="schedule-fields" />;
    }),
  };
});

async function click(label: string) {
  const button = (await screen.findByText(label)).closest('button');
  if (button) fireEvent.click(button);
}

describe('MeetingAdd when the new room slug is taken', () => {
  it('returns to the room step, names the problem and keeps the schedule', async () => {
    vi.mocked(action).mockRejectedValueOnce(new ApiError(409, 'room_name_taken'));
    render(<MeetingAdd />);

    await click('btn.next');
    expect(await screen.findByText('form.slug')).toBeInTheDocument();
    await click('btn.next');
    await click('btn.add_schedule');
    await click('btn.create_meeting');

    expect(await screen.findByText('err.room_name_taken')).toBeInTheDocument();
    expect(screen.getByText('form.slug')).toBeInTheDocument();

    await click('btn.next');
    expect(await screen.findByText('btn.create_meeting')).toBeInTheDocument();
    expect(screen.queryByText('err.room_name_taken')).not.toBeInTheDocument();
  });

  it('retries with the room the first try created instead of adding it again', async () => {
    vi.mocked(action).mockReset();
    vi.mocked(action)
      .mockResolvedValueOnce({ id: 'room-1' })
      .mockRejectedValueOnce(new ApiError(500))
      .mockResolvedValueOnce({ id: 'meeting-1' });
    const onSuccess = vi.fn();
    render(<MeetingAdd onSuccess={onSuccess} />);

    await click('btn.next');
    await click('btn.next');
    await click('btn.add_schedule');
    await click('btn.create_meeting');
    expect(await screen.findByText('err.add')).toBeInTheDocument();

    await click('btn.create_meeting');
    await vi.waitFor(() => expect(onSuccess).toHaveBeenCalled());

    const urls = vi.mocked(action).mock.calls.map(([url]) => url);
    expect(urls.filter((url) => url === '/api/pri/room/add')).toHaveLength(1);
    const first = vi.mocked(action).mock.calls[1][1];
    expect(first).toMatchObject({
      request_id: expect.any(String),
      schedules: [expect.objectContaining({ type: 'o' })],
    });
    expect(vi.mocked(action).mock.calls[2][1]).toEqual(first);
    expect(urls).toHaveLength(3);
    expect(vi.mocked(action).mock.calls[2]).toEqual([
      '/api/pri/meeting/add',
      expect.objectContaining({ room_id: 'room-1' }),
    ]);
  });
});
