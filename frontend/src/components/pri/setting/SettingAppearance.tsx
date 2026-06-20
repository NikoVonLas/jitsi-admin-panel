import { useState } from 'react';
import { action } from '../../../lib/api';
import { useTr } from '../../../i18n';
import { useAppConfig } from '../../../store/appconfig';
import ImageUploadField from '../../common/ImageUploadField';

interface Props {
  readonly settings: { mkey: string; mvalue: string }[];
}

const LOGO_URL = '/api/pub/logo/logo';

export default function SettingAppearance({ settings: _settings }: Props) {
  const t = useTr();
  const { config, setConfig } = useAppConfig();
  const [logoPreviewUrl, setLogoPreviewUrl] = useState(`${LOGO_URL}?t=${Date.now()}`);
  const [faviconPreviewUrl, setFaviconPreviewUrl] = useState(`/api/pub/favicon/favicon-32x32.png?t=${Date.now()}`);

  async function uploadLogo(file: File) {
    const fd = new FormData();
    fd.append('file', file);
    const res = await fetch('/api/pri/profile/logo/upload', { method: 'POST', credentials: 'include', body: fd });
    if (!res.ok) throw new Error('fail');
    const rows = await res.json();
    if (!rows[0]?.url) throw new Error('no url');
    const url = rows[0].url;
    setLogoPreviewUrl(`${url}?t=${Date.now()}`);
    setConfig({ ...config, logo_url: url });
  }

  async function resetLogo() {
    await action('/api/pri/profile/logo/reset', {});
    setLogoPreviewUrl(`${LOGO_URL}?t=${Date.now()}`);
    setConfig({ ...config, logo_url: LOGO_URL });
  }

  async function uploadFavicon(file: File) {
    const fd = new FormData();
    fd.append('file', file);
    const res = await fetch('/api/pri/profile/favicon/upload', { method: 'POST', credentials: 'include', body: fd });
    if (!res.ok) throw new Error('fail');
    const rows = await res.json();
    if (!rows[0]?.html) throw new Error('no html');
    setFaviconPreviewUrl(`/api/pub/favicon/favicon-32x32.png?t=${Date.now()}`);
  }

  async function resetFavicon() {
    await action('/api/pri/profile/favicon/reset', {});
    setFaviconPreviewUrl(`/api/pub/favicon/favicon-32x32.png?t=${Date.now()}`);
  }

  return (
    <div style={{ maxWidth: 680, margin: '0 auto', marginTop: 8 }}>
      <ImageUploadField
        label={t('form.logo')}
        previewUrl={logoPreviewUrl}
        onUpload={uploadLogo}
        onReset={resetLogo}
      />
      <ImageUploadField
        label={t('form.favicon')}
        previewUrl={faviconPreviewUrl}
        previewStyle={{ imageRendering: 'pixelated' }}
        onUpload={uploadFavicon}
        onReset={resetFavicon}
      />

    </div>
  );
}
