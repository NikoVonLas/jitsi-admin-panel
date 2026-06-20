import { useState, useRef } from 'react';
import { Button, Popconfirm } from 'antd';
import { useTr } from '../../i18n';

interface Props {
  readonly label: string;
  readonly previewUrl: string;
  readonly previewStyle?: React.CSSProperties;
  readonly accept?: string;
  readonly onUpload: (file: File) => Promise<void>;
  readonly onReset: () => Promise<void>;
}

export default function ImageUploadField({
  label, previewUrl, previewStyle, accept = 'image/jpeg,image/png,image/svg+xml,image/webp',
  onUpload, onReset,
}: Props) {
  const t = useTr();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState(false);
  const disabled = uploading || resetting;

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setError(false);
      setDone(false);
      setUploading(true);
      await onUpload(file);
      setDone(true);
      setTimeout(() => setDone(false), 2000);
    } catch {
      setError(true);
    } finally {
      setUploading(false);
      if (e.target) e.target.value = '';
    }
  }

  async function handleReset() {
    try {
      setError(false);
      setDone(false);
      setResetting(true);
      await onReset();
    } catch {
      setError(true);
    } finally {
      setResetting(false);
    }
  }

  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 8 }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{
          width: 80, height: 80, border: '1px solid var(--color-border)',
          borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'var(--color-bg-subtle)', flexShrink: 0, overflow: 'hidden',
        }}>
          <img src={previewUrl} alt={label} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', ...previewStyle }} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
          <Button
            icon={<i className="bi bi-upload" />}
            loading={uploading}
            disabled={disabled}
            onClick={() => fileRef.current?.click()}
            block
          >
            {t('form.logo_upload')}
          </Button>
          <Popconfirm
            title={t('form.logo_reset')}
            onConfirm={handleReset}
            okText={t('btn.delete')}
            cancelText={t('btn.cancel')}
            okButtonProps={{ danger: true }}
          >
            <Button danger disabled={disabled} loading={resetting} block>
              {t('form.logo_reset')}
            </Button>
          </Popconfirm>
          {done && (
            <span style={{ color: '#16a34a', fontSize: 12 }}>
              <i className="bi bi-check-circle" /> {t('status.done')}
            </span>
          )}
          {error && (
            <span style={{ color: '#dc2626', fontSize: 12 }}>
              <i className="bi bi-exclamation-circle" /> {t('err.update')}
            </span>
          )}
        </div>
      </div>
      <input ref={fileRef} type="file" accept={accept} style={{ display: 'none' }} onChange={handleFile} />
    </div>
  );
}
