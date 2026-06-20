import { useEffect, useRef } from 'react';
import { Button } from 'antd';
import { actionById } from '../../../lib/api';
import { delMessage, watchTextMessage } from '../../../hooks/useIntercom';
import { toLocaleTime } from '../../../lib/common';
import { useTr } from '../../../i18n';
import type { IntercomMessage222 } from '../../../types';

interface Props {
  readonly msg: IntercomMessage222;
}

export default function TextMessage({ msg }: Props) {
  const t = useTr();
  const soundRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    watchTextMessage(msg.id);
    soundRef.current?.play().catch(() => {});
  }, [msg.id]);

  async function close() {
    try {
      await actionById('/api/pri/intercom/set/seen', msg.id);
    } finally {
      delMessage(msg.id);
    }
  }

  return (
    <div
      style={{
        background: 'var(--color-bg)',
        border: '1px solid var(--color-border)',
        borderRadius: 8,
        padding: '12px 16px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
        minWidth: 280,
        maxWidth: 340,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <i className="bi bi-chat-left-dots" style={{ color: '#3949ab', fontSize: 18 }} />
        <span style={{ fontWeight: 600, flex: 1 }}>{msg.contact_name || t('call.unknown')}</span>
        <span style={{ color: 'var(--color-text-tertiary)', fontSize: 12 }}>{toLocaleTime(msg.created_at)}</span>
        <Button type="text" icon={<i className="bi bi-x" />} onClick={close} />
      </div>
      <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', margin: 0, whiteSpace: 'pre-wrap', maxHeight: 200, overflow: 'auto' }}>
        {msg.intercom_attr.message || ''}
      </p>
      <audio ref={soundRef} src="/notification.mp3">
        <track kind="captions" default src="" label="Captions" />
      </audio>
    </div>
  );
}
