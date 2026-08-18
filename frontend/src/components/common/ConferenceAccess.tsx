import { Button, Tooltip } from 'antd';
import AlertWarning from './AlertWarning';

type Translate = (key: string) => string;

interface HostKeyPanelProps {
  readonly error: boolean;
  readonly loading: boolean;
  readonly hostKey: string;
  readonly resetting: boolean;
  readonly copied: boolean;
  readonly t: Translate;
  readonly onCopy: () => void;
  readonly onReset: () => void;
}

export function HostKeyPanel({
  error,
  loading,
  hostKey,
  resetting,
  copied,
  t,
  onCopy,
  onReset,
}: HostKeyPanelProps) {
  if (error) return <AlertWarning type="error">{t('err.generic')}</AlertWarning>;
  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 24 }}>
        <i className="bi bi-hourglass-split" />
      </div>
    );
  }

  return (
    <>
      <p style={{ color: 'var(--color-text-secondary)', fontSize: 13 }}>
        {t('meeting.host_key_hint')}
      </p>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <code
          style={{
            flex: 1,
            background: 'var(--color-bg-hover)',
            padding: '6px 12px',
            borderRadius: 6,
            fontFamily: 'monospace',
            letterSpacing: '0.1em',
          }}
        >
          {hostKey.replace(/(.{3})(?=.)/g, '$1 ')}
        </code>
        <Button
          aria-label={t('btn.copy')}
          onClick={onCopy}
          icon={
            copied ? (
              <i className="bi bi-check-lg" style={{ color: '#16a34a' }} />
            ) : (
              <i className="bi bi-clipboard" />
            )
          }
        />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Button
          danger
          onClick={onReset}
          loading={resetting}
          icon={<i className="bi bi-arrow-clockwise" />}
        >
          {t('btn.reset_key')}
        </Button>
        <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
          {t('meeting.host_key_reset_warn')}
        </span>
      </div>
    </>
  );
}

interface JoinLinksProps {
  readonly guestUrl: string;
  readonly moderatorUrl: string;
  readonly guestCopied: boolean;
  readonly moderatorCopied: boolean;
  readonly canShare: boolean;
  readonly keyLoading: boolean;
  readonly t: Translate;
  readonly onCopyGuest: () => void;
  readonly onCopyModerator: () => void;
  readonly onShareGuest: () => void;
  readonly onShareModerator: () => void;
  readonly onDownloadQr: () => void;
  readonly onOpenKey: () => void;
}

function CopyIcon({ copied }: { readonly copied: boolean }) {
  return copied ? (
    <i className="bi bi-check-lg" style={{ color: '#16a34a' }} />
  ) : (
    <i className="bi bi-clipboard" />
  );
}

export function JoinLinks({
  guestUrl,
  moderatorUrl,
  guestCopied,
  moderatorCopied,
  canShare,
  keyLoading,
  t,
  onCopyGuest,
  onCopyModerator,
  onShareGuest,
  onShareModerator,
  onDownloadQr,
  onOpenKey,
}: JoinLinksProps) {
  const linkStyle = {
    flex: 1,
    fontSize: 12,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  } as const;

  return (
    <div
      style={{
        marginTop: 8,
        borderTop: '1px solid var(--color-border)',
        paddingTop: 8,
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <a href={guestUrl} target="_blank" rel="noopener noreferrer" style={linkStyle}>
          {t('meeting.link')}
        </a>
        <Tooltip title={t('btn.download_qr')}>
          <Button
            type="text"
            aria-label={t('btn.download_qr')}
            icon={<i className="bi bi-qr-code" />}
            onClick={onDownloadQr}
          />
        </Tooltip>
        <Tooltip title={t('btn.copy')}>
          <Button
            type="text"
            aria-label={`${t('btn.copy')} ${t('meeting.link')}`}
            onClick={onCopyGuest}
            icon={<CopyIcon copied={guestCopied} />}
          />
        </Tooltip>
        {canShare && (
          <Tooltip title={t('btn.share')}>
            <Button
              type="text"
              aria-label={`${t('btn.share')} ${t('meeting.link')}`}
              icon={<i className="bi bi-share" />}
              onClick={onShareGuest}
            />
          </Tooltip>
        )}
      </div>

      {moderatorUrl && moderatorUrl !== guestUrl && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <a href={moderatorUrl} target="_blank" rel="noopener noreferrer" style={linkStyle}>
            {t('meeting.moderator_link')}
          </a>
          <Tooltip title={t('meeting.host_key')}>
            <Button
              type="text"
              aria-label={t('meeting.host_key')}
              loading={keyLoading}
              icon={<i className="bi bi-key" />}
              onClick={onOpenKey}
            />
          </Tooltip>
          <Tooltip title={t('btn.copy')}>
            <Button
              type="text"
              aria-label={`${t('btn.copy')} ${t('meeting.moderator_link')}`}
              onClick={onCopyModerator}
              icon={<CopyIcon copied={moderatorCopied} />}
            />
          </Tooltip>
          {canShare && (
            <Tooltip title={t('btn.share')}>
              <Button
                type="text"
                aria-label={`${t('btn.share')} ${t('meeting.moderator_link')}`}
                icon={<i className="bi bi-share" />}
                onClick={onShareModerator}
              />
            </Tooltip>
          )}
        </div>
      )}
    </div>
  );
}
