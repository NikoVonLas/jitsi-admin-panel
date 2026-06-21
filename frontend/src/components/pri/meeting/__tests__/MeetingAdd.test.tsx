import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
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
});
