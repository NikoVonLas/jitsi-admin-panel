import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import RoomList from '../RoomList';
import type { Domain333, Room333 } from '../../../../types';

vi.mock('../../../../i18n', () => ({
  useTr: () => (k: string) => k,
}));

vi.mock('../../../../hooks/useIsMobile', () => ({
  useIsMobile: () => false,
}));

vi.mock('../../../../lib/api', () => ({
  action: vi.fn().mockResolvedValue({}),
  actionById: vi.fn().mockResolvedValue({}),
  getById: vi.fn().mockResolvedValue({}),
}));

vi.mock('../RoomListItem', () => ({
  default: ({ room }: { room: Room333 }) => (
    <div data-testid="room-item">{room.label || room.name}</div>
  ),
}));

vi.mock('qrcode', () => ({
  toDataURL: vi.fn().mockResolvedValue('data:image/png;base64,FAKE'),
}));

const domains: Domain333[] = [
  { id: 'd1', name: 'Domain 1', auth_type: 'none', url: 'https://d1.example.com', public: false, enabled: true, updated_at: '2024-01-01' },
  { id: 'd2', name: 'Domain 2', auth_type: 'none', url: 'https://d2.example.com', public: false, enabled: true, updated_at: '2024-01-01' },
];

const rooms: Room333[] = [
  { id: 'r1', name: 'room-1', label: 'Room One', short_code: 'abc', domain_name: 'Domain 1', domain_url: 'https://d1.example.com', enabled: true, chain_enabled: true, updated_at: '2024-01-01' },
];

const baseProps = {
  rooms: [],
  total: 0,
  page: 0,
  loading: false,
  pageSize: 10,
  search: '',
  enabledFilter: 'all' as const,
  domains: [],
  domainFilter: '',
};

describe('RoomList', () => {
  it('renders search input', () => {
    render(<RoomList {...baseProps} />);
    expect(document.querySelector('input')).toBeInTheDocument();
  });

  it('renders empty state when no rooms', () => {
    render(<RoomList {...baseProps} />);
    expect(screen.getByText('empty.rooms')).toBeInTheDocument();
  });

  it('renders room items', () => {
    render(<RoomList {...baseProps} rooms={rooms} total={1} />);
    expect(screen.getByTestId('room-item')).toBeInTheDocument();
    expect(screen.getByText('Room One')).toBeInTheDocument();
  });

  it('renders filter segmented control', () => {
    render(<RoomList {...baseProps} />);
    expect(screen.getByText('filter.all')).toBeInTheDocument();
  });

  it('renders domain selector when more than one domain', () => {
    render(<RoomList {...baseProps} domains={domains} />);
    expect(screen.getByText('filter.all_domains')).toBeInTheDocument();
  });

  it('does not render domain selector when single domain', () => {
    render(<RoomList {...baseProps} domains={[domains[0]]} />);
    expect(screen.queryByText('filter.all_domains')).toBeNull();
  });
});
