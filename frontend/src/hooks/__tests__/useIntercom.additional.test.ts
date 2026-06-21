import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { startIntercomStream, watchMessage, watchTextMessage, useIntercomMessages } from '../useIntercom';

vi.mock('../../lib/api', () => ({
  getById: vi.fn(),
}));

vi.mock('../../lib/common', () => ({
  isOver: vi.fn().mockReturnValue(false),
}));

import { getById } from '../../lib/api';
import { isOver } from '../../lib/common';

describe('startIntercomStream', () => {
  it('returns a cleanup function', () => {
    const stop = startIntercomStream();
    expect(typeof stop).toBe('function');
    stop();
  });

  it('cleanup function does not throw', () => {
    const stop = startIntercomStream();
    expect(() => stop()).not.toThrow();
  });
});

describe('watchMessage', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    localStorage.clear();
    vi.mocked(isOver).mockReturnValue(false);
  });

  afterEach(() => {
    vi.useRealTimers();
    localStorage.clear();
  });

  it('deletes message when getById throws', async () => {
    const msgId = 'watch-1';
    localStorage.setItem(`msg-${msgId}`, JSON.stringify({ id: msgId }));
    vi.mocked(getById).mockRejectedValue(new Error('network'));
    await watchMessage(msgId, 100);
    expect(localStorage.getItem(`msg-${msgId}`)).toBeNull();
  });

  it('deletes message when status is not none', async () => {
    const msgId = 'watch-2';
    localStorage.setItem(`msg-${msgId}`, JSON.stringify({ id: msgId }));
    vi.mocked(getById).mockResolvedValue({
      status: 'done',
      expired_at: new Date(Date.now() + 30000).toISOString(),
    });
    await watchMessage(msgId, 100);
    expect(localStorage.getItem(`msg-${msgId}`)).toBeNull();
  });

  it('deletes message when expired', async () => {
    const msgId = 'watch-3';
    localStorage.setItem(`msg-${msgId}`, JSON.stringify({ id: msgId }));
    vi.mocked(getById).mockResolvedValue({
      status: 'none',
      expired_at: new Date(Date.now() - 1000).toISOString(),
    });
    vi.mocked(isOver).mockReturnValue(true);
    await watchMessage(msgId, 100);
    expect(localStorage.getItem(`msg-${msgId}`)).toBeNull();
  });

  it('schedules retry when message is still valid', async () => {
    const msgId = 'watch-4';
    vi.mocked(getById).mockResolvedValue({
      status: 'none',
      expired_at: new Date(Date.now() + 30000).toISOString(),
    });
    vi.mocked(isOver).mockReturnValue(false);
    // Should not throw
    await watchMessage(msgId, 500);
  });
});

describe('watchTextMessage', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    localStorage.clear();
    vi.mocked(isOver).mockReturnValue(false);
  });

  afterEach(() => {
    vi.useRealTimers();
    localStorage.clear();
  });

  it('deletes message when getById throws', async () => {
    const msgId = 'wt-1';
    localStorage.setItem(`msg-${msgId}`, JSON.stringify({ id: msgId }));
    vi.mocked(getById).mockRejectedValue(new Error('network'));
    await watchTextMessage(msgId, 100);
    expect(localStorage.getItem(`msg-${msgId}`)).toBeNull();
  });

  it('deletes message when status is not none', async () => {
    const msgId = 'wt-2';
    localStorage.setItem(`msg-${msgId}`, JSON.stringify({ id: msgId }));
    vi.mocked(getById).mockResolvedValue({
      status: 'read',
      expired_at: new Date(Date.now() + 30000).toISOString(),
    });
    await watchTextMessage(msgId, 100);
    expect(localStorage.getItem(`msg-${msgId}`)).toBeNull();
  });
});

describe('useIntercomMessages', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.mocked(isOver).mockReturnValue(false);
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('does not call onMessagesChange when not authenticated', () => {
    const onChange = vi.fn();
    renderHook(() => useIntercomMessages(false, onChange));
    expect(onChange).not.toHaveBeenCalled();
  });

  it('calls onMessagesChange with initial list when authenticated', () => {
    const onChange = vi.fn();
    renderHook(() => useIntercomMessages(true, onChange));
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith([]);
  });

  it('refreshes when internalMessage event fires', () => {
    const onChange = vi.fn();
    renderHook(() => useIntercomMessages(true, onChange));
    const callsBefore = onChange.mock.calls.length;
    document.dispatchEvent(new CustomEvent('internalMessage'));
    expect(onChange.mock.calls.length).toBeGreaterThan(callsBefore);
  });

  it('cleans up event listeners on unmount', () => {
    const onChange = vi.fn();
    const { unmount } = renderHook(() => useIntercomMessages(true, onChange));
    unmount();
    const callsAfterUnmount = onChange.mock.calls.length;
    document.dispatchEvent(new CustomEvent('internalMessage'));
    expect(onChange.mock.calls.length).toBe(callsAfterUnmount);
  });
});
