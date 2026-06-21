import { describe, it, expect, vi, beforeAll } from 'vitest';
import { render, screen } from '@testing-library/react';
import MessageList from '../MessageList';
import type { IntercomMessage222 } from '../../../../types';

beforeAll(() => {
  window.HTMLMediaElement.prototype.play = vi.fn().mockResolvedValue(undefined);
  window.HTMLMediaElement.prototype.pause = vi.fn();
});

vi.mock('../../../../i18n', () => ({
  useTr: () => (k: string) => k,
}));

vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
}));

vi.mock('../../../../lib/api', () => ({
  actionById: vi.fn().mockResolvedValue({}),
}));

vi.mock('../../../../hooks/useIntercom', () => ({
  watchMessage: vi.fn(),
  watchTextMessage: vi.fn(),
  delMessage: vi.fn(),
}));

vi.mock('../../../../lib/common', () => ({
  toLocaleTime: (_v: string) => '10:00',
}));

const textMsg: IntercomMessage222 = {
  id: 'msg-1',
  contact_id: 'c1',
  contact_name: 'Bob',
  status: 'none',
  message_type: 'text',
  intercom_attr: { message: 'Hi there' },
  created_at: '2024-01-01T10:00:00Z',
  microsec_created_at: 1704067200000000,
  expired_at: '2024-01-02T10:00:00Z',
};

const callMsg: IntercomMessage222 = {
  id: 'msg-2',
  contact_id: 'c2',
  contact_name: 'Alice',
  status: 'none',
  message_type: 'call',
  intercom_attr: {},
  created_at: '2024-01-01T10:00:00Z',
  microsec_created_at: 1704067200000000,
  expired_at: '2024-01-02T10:00:00Z',
};

describe('MessageList', () => {
  it('renders empty container when no messages', () => {
    const { container } = render(<MessageList messages={[]} />);
    expect(container.querySelector('.toast-container')).toBeInTheDocument();
  });

  it('renders text message', () => {
    render(<MessageList messages={[textMsg]} />);
    expect(screen.getByText('Bob')).toBeInTheDocument();
    expect(screen.getByText('Hi there')).toBeInTheDocument();
  });

  it('renders call message', () => {
    render(<MessageList messages={[callMsg]} />);
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('call.calling')).toBeInTheDocument();
  });

  it('renders multiple messages', () => {
    render(<MessageList messages={[textMsg, callMsg]} />);
    expect(screen.getByText('Bob')).toBeInTheDocument();
    expect(screen.getByText('Alice')).toBeInTheDocument();
  });

  it('renders null for unknown message types', () => {
    const unknownMsg = { ...textMsg, id: 'msg-3', message_type: 'phone' as const };
    const { container } = render(<MessageList messages={[unknownMsg]} />);
    // phone type returns null
    expect(container.querySelector('.toast-container')?.children).toHaveLength(0);
  });
});
