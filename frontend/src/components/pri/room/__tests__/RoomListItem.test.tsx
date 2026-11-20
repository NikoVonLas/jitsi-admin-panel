import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { Room333 } from '../../../../types';

vi.mock('qrcode', () => ({
  toDataURL: vi.fn().mockReturnValue(new Promise(() => {})),
}));

vi.mock('../../../../lib/api', () => ({
  listById: vi.fn().mockResolvedValue([]),
  action: vi.fn().mockResolvedValue({}),
  actionById: vi.fn().mockResolvedValue({}),
  getById: vi.fn().mockResolvedValue({}),
}));

vi.mock('../../../../i18n', () => {
  const t = (k: string) => k;
  return { useTr: () => t };
});

vi.mock('../../../../lib/common', () => ({
  copyText: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../RoomUpdate', () => ({
  default: () => <div data-testid="room-update" />,
}));

import RoomListItem from '../RoomListItem';

function makeRoom(overrides: Partial<Room333> = {}): Room333 {
  return {
    id: 'room-1',
    name: 'testroom',
    label: 'Test Room',
    short_code: 'room-code',
    domain_name: 'jitsi.example.com',
    domain_url: 'https://jitsi.example.com',
    enabled: true,
    chain_enabled: true,
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

describe('RoomListItem', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(<RoomListItem room={makeRoom()} />);
  });

  it('renders the room label as title', () => {
    render(<RoomListItem room={makeRoom({ label: 'My Conference Room' })} />);
    expect(screen.getByText('My Conference Room')).toBeInTheDocument();
  });

  it('renders the room name when label is empty', () => {
    render(<RoomListItem room={makeRoom({ label: '', name: 'confroom' })} />);
    expect(screen.getByText('confroom')).toBeInTheDocument();
  });

  it('renders room path including domain and room name', () => {
    render(
      <RoomListItem room={makeRoom({ domain_url: 'https://jitsi.example.com', name: 'myroom' })} />
    );
    expect(screen.getByText('jitsi.example.com/myroom')).toBeInTheDocument();
  });

  it('renders URL section when chain_enabled and short_code are set', () => {
    render(<RoomListItem room={makeRoom({ chain_enabled: true, short_code: 'abc123' })} />);
    expect(screen.getByText('meeting.link')).toBeInTheDocument();
  });

  it('does not render URL section when chain_enabled is false', () => {
    render(<RoomListItem room={makeRoom({ chain_enabled: false })} />);
    expect(screen.queryByText('meeting.link')).not.toBeInTheDocument();
  });

  it('does not render URL section when short_code is empty', () => {
    render(<RoomListItem room={makeRoom({ chain_enabled: true, short_code: '' })} />);
    expect(screen.queryByText('meeting.link')).not.toBeInTheDocument();
  });

  it('renders moderator link when chain is enabled', () => {
    render(<RoomListItem room={makeRoom({ chain_enabled: true, short_code: 'abc123' })} />);
    expect(screen.getByText('meeting.moderator_link')).toBeInTheDocument();
  });

  it('renders a card', () => {
    render(<RoomListItem room={makeRoom()} />);
    expect(document.querySelector('.ant-card')).toBeInTheDocument();
  });

  it('accepts an onRefresh callback', () => {
    const onRefresh = vi.fn();
    render(<RoomListItem room={makeRoom()} onRefresh={onRefresh} />);
    expect(document.querySelector('.ant-card')).toBeInTheDocument();
  });
});

it('lets managers list, add and remove moderators in the room card', async () => {
  const { listById, action } = await import('../../../../lib/api');
  vi.mocked(listById)
    .mockResolvedValueOnce([])
    .mockResolvedValueOnce([{ id: 'member', email: 'mod@example.org' }])
    .mockResolvedValueOnce([]);
  render(<RoomListItem room={makeRoom()} />);
  fireEvent.click(screen.getByRole('button', { name: 'room.moderators' }));
  const input = await screen.findByRole('textbox', { name: 'room.moderator_email' });
  fireEvent.change(input, { target: { value: 'mod@example.org' } });
  fireEvent.click(screen.getByRole('button', { name: 'btn.add' }));
  await screen.findByText('mod@example.org');
  expect(action).toHaveBeenCalledWith('/api/pri/room/moderators/add', {
    id: 'room-1',
    email: 'mod@example.org',
  });
  fireEvent.click(screen.getByRole('button', { name: 'room.revoke_moderator' }));
  await waitFor(() =>
    expect(action).toHaveBeenCalledWith('/api/pri/room/moderators/remove', {
      id: 'room-1',
      identity_id: 'member',
    })
  );
});

it('shows a host entry point without management actions on a shared room', () => {
  render(<RoomListItem room={makeRoom({ shared: true })} />);
  expect(screen.getByRole('link', { name: 'meeting.join_as_mod' })).toHaveAttribute(
    'href',
    globalThis.location.origin + '/rm/room-1'
  );
  expect(screen.queryByRole('button', { name: 'room.moderators' })).not.toBeInTheDocument();
  expect(document.querySelector('.bi-pencil')).toBeNull();
});

it('reports a failed moderator grant and keeps the address for correction', async () => {
  const { listById, action } = await import('../../../../lib/api');
  vi.mocked(listById).mockResolvedValueOnce([]);
  vi.mocked(action).mockRejectedValueOnce(new Error('Unavailable'));
  render(<RoomListItem room={makeRoom()} />);
  fireEvent.click(screen.getByRole('button', { name: 'room.moderators' }));
  const input = await screen.findByRole('textbox', { name: 'room.moderator_email' });
  await waitFor(() => expect(input).toBeEnabled());
  fireEvent.change(input, { target: { value: 'absent@example.org' } });
  fireEvent.click(screen.getByRole('button', { name: 'btn.add' }));
  expect(await screen.findByText('room.moderator_add_error')).toBeInTheDocument();
  expect(input).toHaveValue('absent@example.org');
});
