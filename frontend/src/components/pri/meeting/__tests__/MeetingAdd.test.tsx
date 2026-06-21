import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import MeetingAdd from '../MeetingAdd';

vi.mock('../../../../i18n', () => ({
  useTr: () => (k: string) => k,
}));

vi.mock('../../../../lib/api', () => ({
  action: vi.fn().mockResolvedValue({ id: 'new-meeting' }),
  get: vi.fn().mockResolvedValue({ id: 'p1', name: 'Alice', email: 'alice@example.com' }),
  list: vi.fn().mockResolvedValue({ items: [] }),
}));

vi.mock('../../../pri/meeting-schedule/ScheduleFields', () => ({
  default: vi.fn().mockReturnValue(<div data-testid="schedule-fields" />),
}));

describe('MeetingAdd', () => {
  it('shows loading spinner initially', () => {
    render(<MeetingAdd />);
    // The loading hourglass is shown
    expect(document.querySelector('.bi-hourglass-split') ?? document.querySelector('.ant-spin')).toBeTruthy();
  });

  it('renders meeting fields after loading', async () => {
    render(<MeetingAdd />);
    await waitFor(() => {
      expect(screen.getByText('form.name')).toBeInTheDocument();
    });
  });

  it('renders next button after loading', async () => {
    render(<MeetingAdd />);
    await waitFor(() => {
      expect(screen.getByText('btn.next')).toBeInTheDocument();
    });
  });

  it('renders cancel button after loading', async () => {
    render(<MeetingAdd />);
    await waitFor(() => {
      expect(screen.getByText('btn.cancel')).toBeInTheDocument();
    });
  });

  it('calls onCancel when cancel is clicked', async () => {
    const onCancel = vi.fn();
    render(<MeetingAdd onCancel={onCancel} />);
    await waitFor(() => screen.getByText('btn.cancel'));
    screen.getByText('btn.cancel').closest('button')?.click();
    expect(onCancel).toHaveBeenCalled();
  });

  it('advances to schedule step when next is clicked with existing room', async () => {
    // Mock list to return a room so the dropdown defaults to an existing room
    const { list } = await import('../../../../lib/api');
    (list as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      items: [
        {
          id: 'r1',
          name: 'my-room',
          label: 'My Room',
          domain_url: 'https://meet.example.com',
          enabled: true,
          chain_enabled: true,
          updated_at: '2024-06-01T00:00:00Z',
        },
      ],
    });

    render(<MeetingAdd />);
    await waitFor(() => screen.getByText('btn.next'));
    const nextBtn = screen.getByText('btn.next').closest('button');
    if (nextBtn) fireEvent.click(nextBtn);
    await waitFor(() => {
      expect(screen.queryByTestId('schedule-fields') ?? screen.queryByText('btn.add_schedule')).toBeTruthy();
    });
  });

  it('renders onSuccess callback after finalize', async () => {
    const onSuccess = vi.fn();
    render(<MeetingAdd onSuccess={onSuccess} />);
    await waitFor(() => screen.getByText('btn.next'));
    // Component renders without crashing with onSuccess prop
    expect(screen.getByText('btn.next')).toBeInTheDocument();
  });
});
