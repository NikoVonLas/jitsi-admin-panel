import { useEffect, useCallback } from 'react';
import { getById } from '../lib/api';
import { isOver } from '../lib/common';
import type { IntercomMessage222 } from '../types';

// ---------------------------------------------------------------------------
export function updateMessageList(): IntercomMessage222[] {
  const messages: IntercomMessage222[] = [];
  for (const key in localStorage) {
    try {
      if (!/^msg-/.exec(key)) continue;
      const value = localStorage.getItem(key);
      if (!value) throw new Error('empty message');
      const parsedValue = JSON.parse(value) as IntercomMessage222;
      messages.push(parsedValue);
    } catch {
      localStorage.removeItem(key);
    }
  }

  const sortedMessages = [...messages].sort((a, b) => {
    let dateA = Number(a.microsec_created_at) || 0;
    let dateB = Number(b.microsec_created_at) || 0;
    if (a.message_type !== 'text') dateA = dateA - 8 * 3600 * 1000000;
    if (b.message_type !== 'text') dateB = dateB - 8 * 3600 * 1000000;
    if (dateA > dateB) return -1;
    else if (dateA < dateB) return 1;
    else return 0;
  });

  return sortedMessages.slice(-5);
}

// ---------------------------------------------------------------------------
function setLastMessageTime(msg: IntercomMessage222) {
  try {
    const last = localStorage.getItem('intercom_last_msg_at');
    if (Number.isNaN(Number(last)) || msg.microsec_created_at > Number(last)) {
      localStorage.setItem('intercom_last_msg_at', String(msg.microsec_created_at));
    }
  } catch {
    // ignore
  }
}

// ---------------------------------------------------------------------------
function addMessage(msg: IntercomMessage222) {
  try {
    const isExist = localStorage.getItem(`msg-${msg.id}`);
    if (isExist) return;
    localStorage.setItem(`msg-${msg.id}`, JSON.stringify(msg));
    document.dispatchEvent(new CustomEvent('internalMessage'));
  } catch {
    // ignore
  }
}

// ---------------------------------------------------------------------------
export function delMessage(msgId: string) {
  try {
    localStorage.removeItem(`msg-${msgId}`);
    document.dispatchEvent(new CustomEvent('internalMessage'));
  } catch {
    // ignore
  }
}

// ---------------------------------------------------------------------------
export async function watchMessage(msgId: string, interval = 2000): Promise<void> {
  try {
    const msg = await getById('/api/pri/intercom/get', msgId);
    if (msg.status !== 'none') throw new Error('invalid status');
    const expiredAt = new Date(msg.expired_at);
    if (isOver(expiredAt)) throw new Error('expired message');
    setTimeout(() => watchMessage(msgId, interval), interval);
  } catch {
    delMessage(msgId);
  }
}

// ---------------------------------------------------------------------------
export async function watchTextMessage(msgId: string, interval = 2000): Promise<void> {
  try {
    const msg = await getById('/api/pri/intercom/get', msgId);
    if (msg.status !== 'none') throw new Error('invalid status');
    const expiredAt = new Date(msg.expired_at);
    if (isOver(expiredAt)) throw new Error('expired message');
    const nextInterval = Math.min(2 * interval, 600000);
    setTimeout(() => watchTextMessage(msgId, nextInterval), nextInterval);
  } catch {
    delMessage(msgId);
  }
}

// ---------------------------------------------------------------------------
export function startIntercomStream(): () => void {
  const es = new EventSource('/api/pri/intercom/stream');
  es.onmessage = (event) => {
    try {
      const messages: IntercomMessage222[] = JSON.parse(event.data);
      for (const msg of messages) {
        setLastMessageTime(msg);
        if (
          msg.message_type === 'text' ||
          msg.message_type === 'call' ||
          msg.message_type === 'phone'
        ) {
          addMessage(msg);
        }
      }
    } catch {
      // ignore
    }
  };
  return () => es.close();
}

// ---------------------------------------------------------------------------
export function useIntercomMessages(
  isAuthenticated: boolean,
  onMessagesChange: (msgs: IntercomMessage222[]) => void
) {
  const refresh = useCallback(() => {
    onMessagesChange(updateMessageList());
  }, [onMessagesChange]);

  useEffect(() => {
    if (!isAuthenticated) return;

    // Initial load
    onMessagesChange(updateMessageList());

    // Listen for messages in this tab
    const handleInternal = () => refresh();
    document.addEventListener('internalMessage', handleInternal);

    // Listen for messages from other tabs
    const handleStorage = (e: StorageEvent) => {
      if (e.key?.match('^msg-')) refresh();
    };
    globalThis.addEventListener('storage', handleStorage);

    // Start SSE stream
    const stopStream = startIntercomStream();

    return () => {
      document.removeEventListener('internalMessage', handleInternal);
      globalThis.removeEventListener('storage', handleStorage);
      stopStream();
    };
  }, [isAuthenticated, refresh]);
}
