import { useRef, useState } from 'react';
import { Alert, Button, Card, Input, Typography } from 'antd';
import type { InputRef } from 'antd';
import { CopyOutlined, CheckOutlined, ShareAltOutlined, DownloadOutlined, LoginOutlined, LockOutlined, TeamOutlined } from '@ant-design/icons';
import { useTr } from '../../i18n';
import { useAppConfig } from '../../store/appconfig';

const { Text } = Typography;

interface Props {
  readonly name?: string;
  readonly error?: '' | 'too_early' | 'invalid';
  readonly joining?: boolean;
  readonly participantUrl?: string;
  readonly qrDataUrl?: string;
  readonly canShare?: boolean;
  readonly copiedUrl?: boolean;
  readonly onSubmit?: (hostKey: string) => void;
  readonly onCopyUrl?: () => void;
  readonly onShareUrl?: () => void;
}

export default function ModJoin({
  name = '', error = '', joining = false, participantUrl = '', qrDataUrl = '',
  canShare = false, copiedUrl = false, onSubmit, onCopyUrl, onShareUrl,
}: Props) {
  const tr = useTr();
  const config = useAppConfig((s) => s.config);
  const [parts, setParts] = useState(['', '', '']);
  const PART_KEYS = ['part-0', 'part-1', 'part-2'] as const;
  const inputRefs = [
    useRef<InputRef>(null),
    useRef<InputRef>(null),
    useRef<InputRef>(null),
  ];
  const hostKey = parts.join('');

  function onPartInput(i: number, v: string) {
    const clean = v.replace(/[^a-zA-Z0-9]/g, '').slice(0, 3).toLowerCase();
    const newParts = [...parts];
    newParts[i] = clean;
    setParts(newParts);
    if (clean.length === 3 && i < 2) inputRefs[i + 1].current?.focus();
  }

  function onPartKeydown(e: React.KeyboardEvent<HTMLInputElement>, i: number) {
    if (e.key === 'Backspace' && parts[i] === '' && i > 0) inputRefs[i - 1].current?.focus();
    if (e.key === 'Enter') submit();
  }

  function onPartPaste(e: React.ClipboardEvent<HTMLInputElement>) {
    e.preventDefault();
    const raw = e.clipboardData.getData('text') || '';
    const clean = raw.replace(/[^a-zA-Z0-9]/g, '').slice(0, 9).toLowerCase();
    setParts([clean.slice(0, 3), clean.slice(3, 6), clean.slice(6, 9)]);
    if (clean.length >= 9) { inputRefs[2].current?.focus(); onSubmit?.(clean); }
    else if (clean.length >= 6) inputRefs[2].current?.focus();
    else if (clean.length >= 3) inputRefs[1].current?.focus();
  }

  function submit() {
    if (hostKey.length < 9 || joining) return;
    onSubmit?.(hostKey);
  }

  function downloadQr() {
    if (!qrDataUrl) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = 'participant-qr.png';
    a.click();
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 16px', background: 'var(--color-bg)' }}>
      <Card
        bordered={false}
        style={{ width: '100%', maxWidth: 420, boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}
        styles={{ body: { padding: '40px 48px' } }}
      >
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <img src={config.logo_url || '/logo.svg'} alt="logo" style={{ height: 56 }} />
        </div>

        {/* Meeting name */}
        {name && (
          <Text type="secondary" style={{ display: 'block', textAlign: 'center', marginBottom: 4 }}>
            {name}
          </Text>
        )}

        <div style={{ textAlign: 'center', fontWeight: 600, fontSize: 16, marginBottom: 24 }}>
          <LockOutlined style={{ marginRight: 8, color: 'var(--ant-color-primary)' }} />
          {tr('meeting.join_as_mod')}
        </div>

        {/* Errors */}
        {error === 'too_early' && (
          <Alert type="warning" showIcon message={tr('err.too_early')} style={{ marginBottom: 16 }} />
        )}
        {error === 'invalid' && (
          <Alert type="error" showIcon message={tr('err.host_key_invalid')} style={{ marginBottom: 16 }} />
        )}

        {/* Key input */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 24 }}>
          {parts.map((part, i) => (
            <span key={PART_KEYS[i]} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {i > 0 && (
                <Text type="secondary" style={{ fontWeight: 700, fontSize: 20 }}>·</Text>
              )}
              <Input
                ref={inputRefs[i]}
                status={error ? 'error' : undefined}
                style={{
                  width: 80,
                  textAlign: 'center',
                  fontFamily: 'monospace',
                  fontWeight: 600,
                  fontSize: 20,
                  letterSpacing: '0.18em',
                }}
                type="text"
                inputMode="text"
                maxLength={3}
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="none"
                spellCheck={false}
                value={part}
                disabled={joining}
                onChange={(e) => onPartInput(i, e.target.value)}
                onKeyDown={(e) => onPartKeydown(e, i)}
                onPaste={onPartPaste}
              />
            </span>
          ))}
        </div>

        {/* Join button */}
        <Button
          type="primary"
          block
          size="large"
          loading={joining}
          disabled={hostKey.length < 9}
          icon={joining ? undefined : <LoginOutlined />}
          onClick={submit}
        >
          {tr('btn.join')}
        </Button>
      </Card>

      {/* Participant link card */}
      {participantUrl && (
        <div style={{ position: 'absolute', bottom: 24, width: '100%', maxWidth: 420, padding: '0 16px' }}>
          <Card
            style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
          >
            <Text type="secondary" style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
              <TeamOutlined />{tr('meeting.link')}
            </Text>

            {qrDataUrl && (
              <div style={{ textAlign: 'center', marginBottom: 12 }}>
                <div style={{ display: 'inline-block', padding: 8, background: '#fff', borderRadius: 8, border: '1px solid var(--color-border)' }}>
                  <img src={qrDataUrl} alt="QR" style={{ width: 160, height: 160, display: 'block' }} />
                </div>
                <div style={{ marginTop: 8 }}>
                  <Button icon={<DownloadOutlined />} onClick={downloadQr}>
                    {tr('btn.download_qr')}
                  </Button>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'var(--color-bg-subtle)', border: '1px solid var(--color-border)', borderRadius: 6, padding: '4px 8px' }}>
              <a
                href={participantUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 12, color: 'var(--color-text)' }}
              >
                {participantUrl}
              </a>
              <Button
                type="text"
                icon={copiedUrl ? <CheckOutlined style={{ color: '#52c41a' }} /> : <CopyOutlined />}
                onClick={onCopyUrl}
                title={tr('btn.copy')}
              />
              {canShare && (
                <Button
                  type="text"
                  icon={<ShareAltOutlined />}
                  onClick={onShareUrl}
                  title={tr('btn.share')}
                />
              )}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
