import { describe, it, expect, vi, beforeAll } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import CallMessage from '../CallMessage';
import type { IntercomMessage222 } from '../../../../types';

beforeAll(() => {
  window.HTMLMediaElement.prototype.play = vi.fn().mockResolvedValue(undefined);
  window.HTMLMediaElement.prototype.pause = vi.fn();
});

const mockNavigate = vi.fn();

vi.mock('../../../../i18n', () => ({
  useTr: () => (k: string) => k,
}));

vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

vi.mock('../../../../lib/api', () => ({
  actionById: vi.fn().mockResolvedValue({}),
}));

vi.mock('../../../../hooks/useIntercom', () => ({
  watchMessage: vi.fn(),
  delMessage: vi.fn(),
}));

const msg: IntercomMessage222 = {
  id: 'msg-call-1',
  contact_id: 'c1',
  contact_name: 'Alice',
  status: 'none',
  message_type: 'call',
  intercom_attr: {},
  created_at: '2024-01-01T10:00:00Z',
  microsec_created_at: 1704067200000000,
  expired_at: '2024-01-02T10:00:00Z',
};

describe('CallMessage', () => {
  it('renders the caller name', () => {
    render(<CallMessage msg={msg} />);
    expect(screen.getByText('Alice')).toBeInTheDocument();
  });

  it('renders calling status text', () => {
    render(<CallMessage msg={msg} />);
    expect(screen.getByText('call.calling')).toBeInTheDocument();
  });

  it('renders reject button', () => {
    render(<CallMessage msg={msg} />);
    expect(screen.getByText('btn.reject')).toBeInTheDocument();
  });

  it('renders accept button', () => {
    render(<CallMessage msg={msg} />);
    expect(screen.getByText('btn.accept')).toBeInTheDocument();
  });

  it('navigates to join call on accept', () => {
    render(<CallMessage msg={msg} />);
    fireEvent.click(screen.getByText('btn.accept'));
    expect(mockNavigate).toHaveBeenCalledWith('/call/join/msg-call-1');
  });

  it('renders unknown name when contact_name is null', () => {
    render(<CallMessage msg={{ ...msg, contact_name: null }} />);
    expect(screen.getByText('call.unknown')).toBeInTheDocument();
  });

  it('renders audio element for ringtone', () => {
    render(<CallMessage msg={msg} />);
    expect(document.querySelector('audio')).toBeInTheDocument();
  });
});
