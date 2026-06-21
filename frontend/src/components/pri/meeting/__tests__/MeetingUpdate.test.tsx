import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import MeetingUpdate from '../MeetingUpdate';
import type { Meeting } from '../../../../types';

vi.mock('../../../../i18n', () => ({
  useTr: () => (k: string) => k,
}));

vi.mock('../../../../lib/api', () => ({
  action: vi.fn().mockResolvedValue({ id: 'm1' }),
}));

const meeting: Meeting = {
  id: 'm1',
  name: 'Weekly Standup',
  info: 'Every Monday at 10am',
  profile_id: 'p1',
  profile_name: 'Alice',
  profile_email: 'alice@example.com',
  domain_id: 'd1',
  domain_name: 'Domain 1',
  domain_url: 'https://d1.example.com',
  domain_enabled: true,
  room_id: 'r1',
  room_name: 'Room One',
  room_enabled: true,
  hidden: false,
  subscribable: true,
  enabled: true,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

describe('MeetingUpdate', () => {
  it('renders name field with current value', () => {
    render(<MeetingUpdate meeting={meeting} />);
    expect(screen.getByDisplayValue('Weekly Standup')).toBeInTheDocument();
  });

  it('renders info field with current value', () => {
    render(<MeetingUpdate meeting={meeting} />);
    expect(screen.getByDisplayValue('Every Monday at 10am')).toBeInTheDocument();
  });

  it('renders update button', () => {
    render(<MeetingUpdate meeting={meeting} />);
    expect(screen.getByText('btn.update')).toBeInTheDocument();
  });

  it('renders cancel button', () => {
    render(<MeetingUpdate meeting={meeting} />);
    expect(screen.getByText('btn.cancel')).toBeInTheDocument();
  });

  it('calls onDone when cancel is clicked', () => {
    const onDone = vi.fn();
    render(<MeetingUpdate meeting={meeting} onDone={onDone} />);
    fireEvent.click(screen.getByText('btn.cancel'));
    expect(onDone).toHaveBeenCalled();
  });

  it('calls api action and onDone on successful submit', async () => {
    const { action } = await import('../../../../lib/api');
    const onDone = vi.fn();
    render(<MeetingUpdate meeting={meeting} onDone={onDone} />);
    fireEvent.submit(document.querySelector('form')!);
    await waitFor(() => {
      expect(action).toHaveBeenCalled();
    });
  });
});
