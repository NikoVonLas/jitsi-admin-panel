import { describe, it, expect, vi, beforeAll } from 'vitest';
import { render, screen } from '@testing-library/react';
import TextMessage from '../TextMessage';
import type { IntercomMessage222 } from '../../../../types';

beforeAll(() => {
  window.HTMLMediaElement.prototype.play = vi.fn().mockResolvedValue(undefined);
  window.HTMLMediaElement.prototype.pause = vi.fn();
});

vi.mock('../../../../i18n', () => ({
  useTr: () => (k: string) => k,
}));

vi.mock('../../../../lib/api', () => ({
  actionById: vi.fn().mockResolvedValue({}),
}));

vi.mock('../../../../hooks/useIntercom', () => ({
  watchTextMessage: vi.fn(),
  delMessage: vi.fn(),
}));

vi.mock('../../../../lib/common', () => ({
  toLocaleTime: (_v: string) => '10:00',
}));

const msg: IntercomMessage222 = {
  id: 'msg-1',
  contact_id: 'c1',
  contact_name: 'Bob',
  status: 'none',
  message_type: 'text',
  intercom_attr: { message: 'Hello there!' },
  created_at: '2024-01-01T10:00:00Z',
  microsec_created_at: 1704067200000000,
  expired_at: '2024-01-02T10:00:00Z',
};

describe('TextMessage', () => {
  it('renders the contact name', () => {
    render(<TextMessage msg={msg} />);
    expect(screen.getByText('Bob')).toBeInTheDocument();
  });

  it('renders the message content', () => {
    render(<TextMessage msg={msg} />);
    expect(screen.getByText('Hello there!')).toBeInTheDocument();
  });

  it('renders the time', () => {
    render(<TextMessage msg={msg} />);
    expect(screen.getByText('10:00')).toBeInTheDocument();
  });

  it('renders unknown name when contact_name is null', () => {
    render(<TextMessage msg={{ ...msg, contact_name: null }} />);
    expect(screen.getByText('call.unknown')).toBeInTheDocument();
  });

  it('renders close button', () => {
    render(<TextMessage msg={msg} />);
    expect(document.querySelector('.ant-btn')).toBeInTheDocument();
  });

  it('renders audio element', () => {
    render(<TextMessage msg={msg} />);
    expect(document.querySelector('audio')).toBeInTheDocument();
  });
});
