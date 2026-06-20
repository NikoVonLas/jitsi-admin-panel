import { describe, it, expect, beforeEach, vi } from 'vitest';
import { updateMessageList, delMessage } from '../useIntercom';
import type { IntercomMessage222 } from '../../types';

// Mock the API module
vi.mock('../../lib/api', () => ({
  getById: vi.fn(),
}));

function makeMsg(
  id: string,
  microsec: number,
  type: IntercomMessage222['message_type'] = 'text',
): IntercomMessage222 {
  return {
    id,
    contact_id: null,
    contact_name: null,
    status: 'none',
    message_type: type,
    microsec_created_at: microsec,
    intercom_attr: {},
    expired_at: new Date(Date.now() + 30000).toISOString(),
  };
}

describe('updateMessageList', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns empty array when localStorage is empty', () => {
    expect(updateMessageList()).toEqual([]);
  });

  it('returns messages stored with msg- prefix', () => {
    const msg = makeMsg('msg-001', 1000);
    localStorage.setItem('msg-msg-001', JSON.stringify(msg));
    const result = updateMessageList();
    expect(result.length).toBe(1);
    expect(result[0].id).toBe('msg-001');
  });

  it('ignores keys without msg- prefix', () => {
    localStorage.setItem('other-key', 'value');
    const result = updateMessageList();
    expect(result).toEqual([]);
  });

  it('removes malformed entries and returns clean list', () => {
    localStorage.setItem('msg-bad', 'not-json{{{');
    const result = updateMessageList();
    expect(result).toEqual([]);
    // Malformed entry should be removed
    expect(localStorage.getItem('msg-bad')).toBeNull();
  });

  it('returns at most 5 messages', () => {
    for (let i = 0; i < 10; i++) {
      const msg = makeMsg(`id-${i}`, i * 1000);
      localStorage.setItem(`msg-id-${i}`, JSON.stringify(msg));
    }
    const result = updateMessageList();
    expect(result.length).toBeLessThanOrEqual(5);
  });

  it('sorts text messages by microsec_created_at descending', () => {
    const msg1 = makeMsg('id-1', 1000, 'text');
    const msg2 = makeMsg('id-2', 3000, 'text');
    const msg3 = makeMsg('id-3', 2000, 'text');
    localStorage.setItem('msg-id-1', JSON.stringify(msg1));
    localStorage.setItem('msg-id-2', JSON.stringify(msg2));
    localStorage.setItem('msg-id-3', JSON.stringify(msg3));

    const result = updateMessageList();
    expect(result[0].id).toBe('id-2'); // highest microsec first
  });

  it('places call messages below text messages', () => {
    const text = makeMsg('text-1', 5000, 'text');
    const call = makeMsg('call-1', 9000, 'call'); // higher microsec but call type
    localStorage.setItem('msg-text-1', JSON.stringify(text));
    localStorage.setItem('msg-call-1', JSON.stringify(call));

    const result = updateMessageList();
    // text with 5000 should rank higher than call with 9000 - 8h offset
    const textIdx = result.findIndex((m) => m.id === 'text-1');
    const callIdx = result.findIndex((m) => m.id === 'call-1');
    expect(textIdx).toBeLessThan(callIdx);
  });
});

describe('delMessage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('removes message from localStorage', () => {
    const msg = makeMsg('del-1', 1000);
    localStorage.setItem('msg-del-1', JSON.stringify(msg));

    delMessage('del-1');

    expect(localStorage.getItem('msg-del-1')).toBeNull();
  });

  it('dispatches internalMessage event', () => {
    const listener = vi.fn();
    document.addEventListener('internalMessage', listener);

    delMessage('any-id');

    expect(listener).toHaveBeenCalled();
    document.removeEventListener('internalMessage', listener);
  });

  it('does not throw when message does not exist', () => {
    expect(() => delMessage('nonexistent')).not.toThrow();
  });
});
