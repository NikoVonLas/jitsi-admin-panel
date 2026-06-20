import { useState, useEffect } from 'react';
import { Tabs, Modal } from 'antd';
import { useNavigate } from 'react-router-dom';
import { list } from '../../lib/api';
import { useTr } from '../../i18n';
import { useRoleStore } from '../../store/role';
import type { Domain333 } from '../../types';
import Subheader from '../../components/common/Subheader';
import AlertWarning from '../../components/common/AlertWarning';
import Spinner from '../../components/common/Spinner';
import DomainList from '../../components/pri/domain/DomainList';
import DomainAdd from '../../components/pri/domain/DomainAdd';
import SettingGeneral from '../../components/pri/setting/SettingGeneral';
import SettingMailer from '../../components/pri/setting/SettingMailer';
import SettingAppearance from '../../components/pri/setting/SettingAppearance';
import SettingAuth from '../../components/pri/setting/SettingAuth';
import SettingUsers from '../../components/pri/setting/SettingUsers';

type Tab = 'general' | 'appearance' | 'domains' | 'mailer' | 'auth' | 'users';

export default function SettingPage() {
  const t = useTr();
  const navigate = useNavigate();
  const { isSuperAdmin } = useRoleStore();
  const urlTab = new URLSearchParams(globalThis.location.search).get('tab') as Tab;
  const validTabs: Tab[] = ['general', 'appearance', 'domains', 'mailer', 'auth', 'users'];
  const [activeTab, setActiveTab] = useState<Tab>(validTabs.includes(urlTab) ? urlTab : 'general');
  const [domains, setDomains] = useState<Domain333[]>([]);
  const [domainsError, setDomainsError] = useState(false);
  const [settings, setSettings] = useState<{ mkey: string; mvalue: string }[]>([]);
  const [authLocal, setAuthLocal] = useState(true);
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [settingsError, setSettingsError] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [usersAddOpen, setUsersAddOpen] = useState(false);
  const [authAddOpen, setAuthAddOpen] = useState(false);

  useEffect(() => {
    if (isSuperAdmin === false) navigate('/', { replace: true });
  }, [isSuperAdmin, navigate]);

  useEffect(() => {
    list('/api/pri/setting/get', 100)
      .then((res) => setSettings(Array.isArray(res) ? res : []))
      .catch(() => setSettingsError(true))
      .finally(() => setSettingsLoading(false));
    fetch('/api/adm/auth/config')
      .then((r) => r.json())
      .then((d) => setAuthLocal(d.local ?? true))
      .catch(() => {});
  }, []);

  async function loadDomains() {
    try {
      setDomainsError(false);
      const res = await list('/api/pri/domain/list', 100);
      setDomains(Array.isArray(res) ? res : (res.items ?? []));
    } catch { setDomainsError(true); }
  }

  useEffect(() => { loadDomains(); }, []);

  function switchTab(tab: Tab) {
    setActiveTab(tab);
    const url = new URL(globalThis.location.href);
    url.searchParams.set('tab', tab);
    globalThis.history.replaceState({}, '', url.toString());
  }

  if (isSuperAdmin === null) return <Spinner />;
  if (isSuperAdmin === false) return null;

  function getAddHandler(): (() => void) | undefined {
    if (activeTab === 'domains') return () => setAddOpen(true);
    if (activeTab === 'users') return () => setUsersAddOpen(true);
    if (activeTab === 'auth') return () => setAuthAddOpen(true);
    return undefined;
  }

  function renderActiveTab() {
    if (activeTab === 'general') return <SettingGeneral settings={settings} />;
    if (activeTab === 'appearance') return <SettingAppearance settings={settings} />;
    if (activeTab === 'domains') {
      if (domainsError) return <AlertWarning type="error">{t('err.generic')}</AlertWarning>;
      return <DomainList domains={domains} onRefresh={loadDomains} />;
    }
    if (activeTab === 'mailer') return <SettingMailer settings={settings} />;
    if (activeTab === 'auth') return <SettingAuth addOpen={authAddOpen} onAddClose={() => setAuthAddOpen(false)} />;
    if (activeTab === 'users') return <SettingUsers addOpen={usersAddOpen} onAddClose={() => setUsersAddOpen(false)} />;
    return null;
  }

  const tabItems = [
    { key: 'general', label: t('setting.general') },
    { key: 'appearance', label: t('setting.appearance') },
    { key: 'domains', label: t('nav.domains') },
    { key: 'mailer', label: t('setting.mailer') },
    { key: 'auth', label: t('setting.auth') || 'Authentication' },
    ...(authLocal ? [{ key: 'users', label: t('setting.users') }] : []),
  ];

  return (
    <div>
      <Subheader
        title={t('page.settings')}
        onAdd={getAddHandler()}
        addTitle={t('sub.add')}
        addHidden={activeTab !== 'domains' && activeTab !== 'users' && activeTab !== 'auth'}
      />
      <Tabs activeKey={activeTab} onChange={(k) => switchTab(k as Tab)} items={tabItems.map((item) => ({ key: item.key, label: item.label, children: null }))} style={{ marginTop: 8 }} />
      <div style={{ marginTop: 8 }}>
        {settingsError && <AlertWarning type="error">{t('err.generic')}</AlertWarning>}
        {settingsLoading ? <Spinner /> : renderActiveTab()}
      </div>
      <Modal open={addOpen} onCancel={() => setAddOpen(false)} title={t('page.add_domain')} footer={null} width={600}>
        <DomainAdd onCancel={() => setAddOpen(false)} onDone={() => { setAddOpen(false); loadDomains(); }} />
      </Modal>
    </div>
  );
}
