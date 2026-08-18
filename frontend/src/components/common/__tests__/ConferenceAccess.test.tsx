import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { HostKeyPanel, JoinLinks } from '../ConferenceAccess';

const t = (key: string) => key;

describe('HostKeyPanel', () => {
  const baseProps = {
    error: false,
    loading: false,
    hostKey: '123456789',
    resetting: false,
    copied: false,
    t,
    onCopy: vi.fn(),
    onReset: vi.fn(),
  };

  it('renders error and loading states', () => {
    const { rerender } = render(<HostKeyPanel {...baseProps} error />);
    expect(screen.getByText('err.generic')).toBeInTheDocument();

    rerender(<HostKeyPanel {...baseProps} loading />);
    expect(document.querySelector('.bi-hourglass-split')).toBeInTheDocument();
  });

  it('formats the key and invokes key actions', () => {
    const onCopy = vi.fn();
    const onReset = vi.fn();
    render(<HostKeyPanel {...baseProps} copied onCopy={onCopy} onReset={onReset} />);

    expect(screen.getByText('123 456 789')).toBeInTheDocument();
    expect(document.querySelector('.bi-check-lg')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'btn.copy' }));
    fireEvent.click(screen.getByRole('button', { name: 'btn.reset_key' }));
    expect(onCopy).toHaveBeenCalledOnce();
    expect(onReset).toHaveBeenCalledOnce();
  });
});

describe('JoinLinks', () => {
  function props() {
    return {
      guestUrl: 'https://panel.test/j/guest',
      moderatorUrl: 'https://panel.test/jm/moderator',
      guestCopied: false,
      moderatorCopied: true,
      canShare: true,
      keyLoading: false,
      t,
      onCopyGuest: vi.fn(),
      onCopyModerator: vi.fn(),
      onShareGuest: vi.fn(),
      onShareModerator: vi.fn(),
      onDownloadQr: vi.fn(),
      onOpenKey: vi.fn(),
    };
  }

  it('renders guest and moderator links and invokes every action', () => {
    const handlers = props();
    render(<JoinLinks {...handlers} />);

    expect(screen.getByRole('link', { name: 'meeting.link' })).toHaveAttribute(
      'href',
      handlers.guestUrl
    );
    expect(screen.getByRole('link', { name: 'meeting.moderator_link' })).toHaveAttribute(
      'href',
      handlers.moderatorUrl
    );

    fireEvent.click(screen.getByRole('button', { name: 'btn.download_qr' }));
    fireEvent.click(screen.getByRole('button', { name: 'btn.copy meeting.link' }));
    fireEvent.click(screen.getByRole('button', { name: 'btn.share meeting.link' }));
    fireEvent.click(screen.getByRole('button', { name: 'meeting.host_key' }));
    fireEvent.click(screen.getByRole('button', { name: 'btn.copy meeting.moderator_link' }));
    fireEvent.click(screen.getByRole('button', { name: 'btn.share meeting.moderator_link' }));

    expect(handlers.onDownloadQr).toHaveBeenCalledOnce();
    expect(handlers.onCopyGuest).toHaveBeenCalledOnce();
    expect(handlers.onShareGuest).toHaveBeenCalledOnce();
    expect(handlers.onOpenKey).toHaveBeenCalledOnce();
    expect(handlers.onCopyModerator).toHaveBeenCalledOnce();
    expect(handlers.onShareModerator).toHaveBeenCalledOnce();
  });

  it('hides duplicate moderator and share actions', () => {
    const handlers = props();
    render(
      <JoinLinks {...handlers} moderatorUrl={handlers.guestUrl} canShare={false} guestCopied />
    );

    expect(screen.queryByText('meeting.moderator_link')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /btn.share/ })).not.toBeInTheDocument();
    expect(document.querySelector('.bi-check-lg')).toBeInTheDocument();
  });
});
