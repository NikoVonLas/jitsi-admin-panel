import { useState, useRef, useEffect } from 'react';
import { Button, Form, Spin } from 'antd';
import { action } from '../../../lib/api';
import { useTr } from '../../../i18n';
import type { Profile } from '../../../types';
import AlertWarning from '../../common/AlertWarning';
import FormText from '../../common/FormText';

const AVATAR_COLORS = [
  '#1a73e8', '#e53935', '#43a047', '#fb8c00', '#8e24aa',
  '#00897b', '#d81b60', '#3949ab', '#039be5', '#f4511e',
];

function avatarInitials(n: string): string {
  const words = n.trim().split(/\s+/).filter(Boolean);
  if (!words.length) return '?';
  if (words.length === 1) return words[0][0].toUpperCase();
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}

function avatarColor(n: string): string {
  let hash = 0;
  for (let i = 0; i < n.length; i++) hash = Math.trunc(hash * 31 + (n.codePointAt(i) ?? 0));
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

interface Props {
  readonly profile: Profile;
  readonly onSave?: () => void;
}

export default function ProfileUpdate({ profile, onSave }: Props) {
  const t = useTr();
  const [name, setName] = useState(profile.name);
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url);
  const [warning, setWarning] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [disabled, setDisabled] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    clearTimeout(saveTimer.current);
    if (name === profile.name) return;
    saveTimer.current = setTimeout(async () => {
      try {
        setWarning(false);
        await action('/api/pri/profile/update', { ...profile, avatar_url: avatarUrl, name });
        onSave?.();
      } catch {
        setWarning(true);
      }
    }, 700);
    return () => clearTimeout(saveTimer.current);
  }, [name]);

  async function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploading(true);
      setDisabled(true);
      setWarning(false);
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/pri/profile/avatar/upload', {
        method: 'POST', credentials: 'include', body: fd,
      });
      if (!res.ok) throw new Error('upload failed');
      const rows = await res.json();
      if (!rows[0]?.url) throw new Error('no url');
      const newUrl = rows[0].url;
      setAvatarUrl(newUrl);
      await action('/api/pri/profile/update', { ...profile, avatar_url: newUrl, name });
    } catch {
      setWarning(true);
    } finally {
      setUploading(false);
      setDisabled(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  async function removeAvatar() {
    setAvatarUrl('');
    try {
      await action('/api/pri/profile/update', { ...profile, avatar_url: '', name });
    } catch { setWarning(true); }
  }

  return (
    <section>
    <Form layout="vertical">
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 24 }}>
        <button
          type="button"
          style={{ position: 'relative', cursor: 'pointer', borderRadius: '50%', background: 'none', border: 'none', padding: 0 }}
          onClick={() => !disabled && fileRef.current?.click()}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { if (!disabled) fileRef.current?.click(); } }}
        >
          {avatarUrl ? (
            <img src={avatarUrl} alt="avatar" style={{ width: 96, height: 96, borderRadius: '50%', objectFit: 'cover', display: 'block' }} />
          ) : (
            <div className="avatar-initials" style={{ width: 96, height: 96, background: avatarColor(name), fontSize: '2rem', fontWeight: 600 }}>
              {avatarInitials(name)}
            </div>
          )}
          <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: uploading ? 1 : 0, transition: 'opacity 0.15s' }} className="avatar-hover-overlay">
            {uploading ? <Spin /> : <i className="bi bi-camera-fill" style={{ color: 'var(--color-bg)', fontSize: 20 }} />}
          </div>
        </button>
        <style>{`.avatar-hover-overlay:hover{opacity:1!important}button:hover>.avatar-hover-overlay{opacity:1!important}`}</style>
        <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/gif,image/webp" style={{ display: 'none' }} onChange={onFileChange} />
        <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
          {avatarUrl && (
            <Button type="link" danger style={{ padding: 0 }} onClick={removeAvatar} disabled={disabled}>
              {t('form.avatar_remove')}
            </Button>
          )}
        </div>
      </div>
      <FormText name="name" label={t('form.display_name')} value={name} onChange={setName} required disabled={disabled} />
      {warning && <AlertWarning type="error">{t('err.update')}</AlertWarning>}
    </Form>
    </section>
  );
}
