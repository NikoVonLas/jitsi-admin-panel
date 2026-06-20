import { useState, useEffect } from 'react';
import { Button, Drawer, Typography, Divider, Segmented, Spin } from 'antd';
import { useNavigate } from 'react-router-dom';
import { get } from '../../lib/api';
import { useTr } from '../../i18n';
import { usePrefStore, type Theme } from '../../store/pref';
import type { Lang } from '../../i18n';
import type { Profile } from '../../types';
import ProfileUpdate from '../pri/profile/ProfileUpdate';

const { Text } = Typography;

const AVATAR_COLORS = [
  '#1a73e8', '#e53935', '#43a047', '#fb8c00', '#8e24aa',
  '#00897b', '#d81b60', '#3949ab', '#039be5', '#f4511e',
];

function avatarInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (!words.length) return '?';
  if (words.length === 1) return words[0][0].toUpperCase();
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}

function avatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = Math.trunc(hash * 31 + (name.codePointAt(i) ?? 0));
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export default function ButtonAccountOidc() {
  const t = useTr();
  const navigate = useNavigate();
  const { lang, theme, setLang, setTheme } = usePrefStore();
  const [open, setOpen] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(false);

  async function loadProfile() {
    if (profile) return;
    setLoading(true);
    try {
      const p = await get('/api/pri/profile/get/default');
      setProfile(p as Profile);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadProfile().catch(() => {}); }, []);

  function handleTheme(val: Theme) {
    setTheme(val).catch(() => {});
  }

  function handleLang(val: Lang) {
    setLang(val).catch(() => {});
  }

  const themeOptions = [
    { value: 'system', label: t('pref.theme_system') },
    { value: 'light', label: t('pref.theme_light') },
    { value: 'dark', label: t('pref.theme_dark') },
  ];

  const langOptions = [
    { value: 'en', label: t('setting.lang_en') },
    { value: 'ru', label: t('setting.lang_ru') },
  ];

  return (
    <>
      <Button
        icon={loading ? <Spin /> : <i className="bi bi-person" />}
        onClick={() => setOpen((v) => !v)}
      >
        {profile?.name ? profile.name.split(' ')[0] : null}
      </Button>
      <Drawer
        title={t('nav.account')}
        placement="right"
        open={open}
        onClose={() => setOpen(false)}
        width={320}
        zIndex={1100}
      >
        {profile && (
          <>
            <ProfileUpdate profile={profile} onSave={() => {}} />
            <Divider />
          </>
        )}

        <div style={{ marginBottom: 16 }}>
          <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 8 }}>
            {t('pref.appearance')}
          </Text>
          <Segmented
            options={themeOptions}
            value={theme}
            onChange={(v) => handleTheme(v as Theme)}
            block
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 8 }}>
            {t('pref.language')}
          </Text>
          <Segmented options={langOptions} value={lang ?? 'en'} onChange={(v) => handleLang(v as Lang)} block />
        </div>

        <Divider />

        <Button
          type="link"
          danger
          onClick={() => {
            setOpen(false);
            navigate('/oidc/logout');
          }}
        >
          <i className="bi bi-box-arrow-right" style={{ marginRight: 4 }} />
          {t('nav.logout')}
        </Button>
      </Drawer>
    </>
  );
}
