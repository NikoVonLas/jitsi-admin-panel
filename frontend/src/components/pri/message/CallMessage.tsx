import { useEffect, useRef } from 'react';
import { Button } from 'antd';
import { useNavigate } from 'react-router-dom';
import { actionById } from '../../../lib/api';
import { delMessage, watchMessage } from '../../../hooks/useIntercom';
import { useTr } from '../../../i18n';
import type { IntercomMessage222 } from '../../../types';

interface Props {
  readonly msg: IntercomMessage222;
}

export default function CallMessage({ msg }: Props) {
  const t = useTr();
  const navigate = useNavigate();
  const ringRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    watchMessage(msg.id);
    ringRef.current?.play().catch(() => {});
  }, [msg.id]);

  function accept() {
    ringRef.current?.pause();
    navigate(`/call/join/${msg.id}`);
  }

  async function reject() {
    ringRef.current?.pause();
    try {
      await actionById('/api/pri/intercom/set/rejected', msg.id);
    } finally {
      delMessage(msg.id);
    }
  }

  async function close() {
    ringRef.current?.pause();
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
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <i className="bi bi-telephone ringing-icon" style={{ color: '#3949ab', fontSize: 18 }} />
        <span style={{ fontWeight: 600, flex: 1 }}>{msg.contact_name || t('call.unknown')}</span>
        <span style={{ color: 'var(--color-text-tertiary)', fontSize: 12 }}>{t('call.calling')}</span>
        <Button type="text" icon={<i className="bi bi-x" />} onClick={close} />
      </div>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
        <Button danger onClick={reject}>{t('btn.reject')}</Button>
        <Button type="primary" style={{ background: '#16a34a', borderColor: '#16a34a' }} onClick={accept}>{t('btn.accept')}</Button>
      </div>
      <audio ref={ringRef} src="/ringing.mp3" loop>
        <track kind="captions" default src="" label="Captions" />
      </audio>
    </div>
  );
}
