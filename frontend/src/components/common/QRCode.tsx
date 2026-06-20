import { useState, useEffect } from 'react';
import { Button } from 'antd';
import { toDataURL } from 'qrcode';
import { useTr } from '../../i18n';

interface Props {
  readonly url: string;
  readonly filename?: string;
  readonly size?: number;
}

export default function QRCode({ url, filename = 'qr.png', size = 160 }: Props) {
  const t = useTr();
  const [dataUrl, setDataUrl] = useState('');
  useEffect(() => {
    if (url) toDataURL(url, { width: size * 2, margin: 2 }).then(setDataUrl).catch(() => {});
  }, [url, size]);
  function download() {
    if (!dataUrl) return;
    const a = document.createElement('a');
    a.href = dataUrl; a.download = filename; a.click();
  }
  if (!dataUrl) return null;
  return (
    <div style={{ textAlign: 'center', marginBottom: 12 }}>
      <div style={{ display: 'inline-block', padding: 8, background: 'var(--color-bg)', borderRadius: 8, border: '1px solid var(--color-border)' }}>
        <img src={dataUrl} alt="QR" style={{ width: size, height: size, display: 'block' }} />
      </div>
      <div style={{ marginTop: 8 }}>
        <Button icon={<i className="bi bi-download" />} onClick={download}>
          {t('btn.download_qr')}
        </Button>
      </div>
    </div>
  );
}
