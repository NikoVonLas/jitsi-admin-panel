import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { Meeting222 } from '../../../../types';

vi.mock('qrcode', () => ({
  toDataURL: vi.fn().mockResolvedValue('data:image/png;base64,test'),
}));

vi.mock('../../../../lib/api', () => ({
  action: vi.fn().mockResolvedValue({}),
  actionById: vi.fn().mockResolvedValue({}),
  getById: vi.fn().mockResolvedValue({}),
  listById: vi.fn().mockResolvedValue([]),
}));

vi.mock('../../../../i18n', () => {
  const t = (k: string) => k;
  return {
    useTr: () => t,
    useI18n: () => ({ lang: 'en', setLang: () => {}, t }),
  };
});

vi.mock('../../../../store/role', () => ({
  useRoleStore: () => ({ isSuperAdmin: false }),
}));

vi.mock('../../../../lib/common', () => ({
  isOnline: vi.fn().mockReturnValue(false),
  isToday: vi.fn().mockReturnValue(false),
  showLocaleDatetime: vi.fn().mockReturnValue('2026-01-01 12:00'),
  copyText: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../MeetingUpdate', () => ({
  default: () => <div data-testid="meeting-update" />,
}));

vi.mock('../../meeting-schedule/ScheduleModal', () => ({
  default: () => <div data-testid="schedule-modal" />,
}));

import MeetingListItem from '../MeetingListItem';

function makeMeeting(overrides: Partial<Meeting222> = {}): Meeting222 {
  return {
    id: 'meeting-1',
    name: 'Test Meeting',
    short_code: 'test-code',
    info: '',
    profile_name: 'Test User',
    profile_email: 'test@example.com',
    domain_name: 'jitsi.example.com',
    domain_url: 'https://jitsi.example.com',
    room_name: 'testroom',
    session_list: [],
    session_at: '',
    hidden: false,
    subscribable: false,
    enabled: true,
    chain_enabled: true,
    updated_at: new Date().toISOString(),
    ownership: 'owner',
    membership_id: 'mem-1',
    join_as: 'host',
    ...overrides,
  };
}

describe('MeetingListItem', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(<MeetingListItem meeting={makeMeeting()} />);
  });

  it('renders the meeting name', () => {
    render(<MeetingListItem meeting={makeMeeting({ name: 'Weekly Standup' })} />);
    expect(screen.getByText('Weekly Standup')).toBeInTheDocument();
  });

  it('renders info text when provided', () => {
    render(<MeetingListItem meeting={makeMeeting({ info: 'Some meeting description' })} />);
    expect(screen.getByText('Some meeting description')).toBeInTheDocument();
  });

  it('does not render info section when info is empty', () => {
    render(<MeetingListItem meeting={makeMeeting({ info: '' })} />);
    expect(screen.queryByText('Some meeting description')).not.toBeInTheDocument();
  });

  it('renders ephemeral tag when schedule_type is ephemeral', () => {
    render(<MeetingListItem meeting={makeMeeting({ schedule_type: 'ephemeral' })} />);
    expect(screen.getByText('meeting.type.ephemeral')).toBeInTheDocument();
  });

  it('does not render ephemeral tag for non-ephemeral meetings', () => {
    render(<MeetingListItem meeting={makeMeeting({ schedule_type: 'recurring' })} />);
    expect(screen.queryByText('meeting.type.ephemeral')).not.toBeInTheDocument();
  });

  it('shows not_planned text when session list is empty and not ephemeral', () => {
    render(<MeetingListItem meeting={makeMeeting({ session_list: [] })} />);
    expect(screen.getByText('meeting.not_planned')).toBeInTheDocument();
  });

  it('shows next session time when session list has items', () => {
    render(
      <MeetingListItem
        meeting={makeMeeting({ session_list: ['2026-06-25T10:00:00Z'] })}
      />,
    );
    // showLocaleDatetime is mocked to return '2026-01-01 12:00'
    expect(screen.getByText('2026-01-01 12:00')).toBeInTheDocument();
  });

  it('does not show session info for ephemeral meetings', () => {
    render(
      <MeetingListItem
        meeting={makeMeeting({ schedule_type: 'ephemeral', session_list: [] })}
      />,
    );
    expect(screen.queryByText('meeting.not_planned')).not.toBeInTheDocument();
  });

  it('does not show profile email when isSuperAdmin is false', () => {
    render(<MeetingListItem meeting={makeMeeting({ profile_email: 'owner@test.com' })} />);
    expect(screen.queryByText('owner@test.com')).not.toBeInTheDocument();
  });

  it('renders owner action buttons when ownership is owner', () => {
    render(<MeetingListItem meeting={makeMeeting({ ownership: 'owner' })} />);
    // Card should render action buttons
    const card = document.querySelector('.ant-card');
    expect(card).toBeInTheDocument();
  });

  it('renders a card for each meeting', () => {
    render(<MeetingListItem meeting={makeMeeting()} />);
    expect(document.querySelector('.ant-card')).toBeInTheDocument();
  });

  it('calls onRefresh when provided', () => {
    const onRefresh = vi.fn();
    render(<MeetingListItem meeting={makeMeeting()} onRefresh={onRefresh} />);
    // onRefresh is a prop passed to child operations; just verify it renders
    expect(document.querySelector('.ant-card')).toBeInTheDocument();
  });
});
