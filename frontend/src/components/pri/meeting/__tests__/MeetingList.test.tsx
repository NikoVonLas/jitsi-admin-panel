import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import MeetingList from '../MeetingList';
import type { Domain333, Meeting222, Room333 } from '../../../../types';

vi.mock('../../../../i18n', () => ({
  useTr: () => (k: string) => k,
  useI18n: () => ({ lang: 'en', setLang: () => {}, t: (k: string) => k }),
}));

vi.mock('../../../../hooks/useIsMobile', () => ({
  useIsMobile: () => false,
}));

vi.mock('../../../../store/pref', () => ({
  usePrefStore: (sel: (s: { lang: null }) => unknown) => sel({ lang: null }),
}));

vi.mock('../MeetingListItem', () => ({
  default: ({ meeting }: { meeting: Meeting222 }) => (
    <div data-testid="meeting-item">{meeting.name}</div>
  ),
}));

const domains: Domain333[] = [
  { id: 'd1', name: 'Domain 1', auth_type: 'none', url: 'https://d1.example.com', public: false, enabled: true, updated_at: '2024-01-01' },
  { id: 'd2', name: 'Domain 2', auth_type: 'none', url: 'https://d2.example.com', public: false, enabled: true, updated_at: '2024-01-01' },
];

const rooms: Room333[] = [
  { id: 'r1', name: 'room-1', label: 'Room One', short_code: 'abc', domain_name: 'Domain 1', domain_url: 'https://d1.example.com', enabled: true, chain_enabled: true, updated_at: '2024-01-01' },
  { id: 'r2', name: 'room-2', label: 'Room Two', short_code: 'def', domain_name: 'Domain 2', domain_url: 'https://d2.example.com', enabled: true, chain_enabled: true, updated_at: '2024-01-01' },
];

const meetings: Meeting222[] = [
  {
    id: 'm1', name: 'Team Standup', short_code: 'ts1', info: '',
    profile_name: 'Alice', profile_email: 'alice@example.com',
    domain_name: 'Domain 1', domain_url: 'https://d1.example.com',
    room_name: 'room-1', session_list: [], session_at: '',
    hidden: false, subscribable: true, enabled: true, chain_enabled: true,
    updated_at: '2024-01-01', ownership: 'owner', membership_id: 'm1',
    join_as: 'host',
  },
];

const baseProps = {
  meetings: [],
  total: 0,
  page: 0,
  loading: false,
  pageSize: 10,
  search: '',
  enabledFilter: 'all' as const,
  rooms: [],
  domains: [],
  roomFilter: '',
  domainFilter: '',
  dateFilter: '',
};

describe('MeetingList', () => {
  it('renders without crashing', () => {
    render(<MeetingList {...baseProps} />);
    expect(document.querySelector('input')).toBeInTheDocument();
  });

  it('renders empty state when no meetings', () => {
    render(<MeetingList {...baseProps} />);
    expect(screen.getByText('empty.meetings')).toBeInTheDocument();
  });

  it('renders meeting items', () => {
    render(<MeetingList {...baseProps} meetings={meetings} total={1} />);
    expect(screen.getByTestId('meeting-item')).toBeInTheDocument();
    expect(screen.getByText('Team Standup')).toBeInTheDocument();
  });

  it('renders filter controls', () => {
    render(<MeetingList {...baseProps} />);
    expect(screen.getByText('filter.all')).toBeInTheDocument();
  });

  it('renders room selector when more than one room', () => {
    render(<MeetingList {...baseProps} rooms={rooms} />);
    expect(screen.getByText('filter.all_rooms')).toBeInTheDocument();
  });

  it('renders domain selector when more than one domain', () => {
    render(<MeetingList {...baseProps} domains={domains} />);
    expect(screen.getByText('filter.all_domains')).toBeInTheDocument();
  });

  it('does not render room selector for single room', () => {
    render(<MeetingList {...baseProps} rooms={[rooms[0]]} />);
    expect(screen.queryByText('filter.all_rooms')).toBeNull();
  });
});
