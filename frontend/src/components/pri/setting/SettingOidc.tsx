import { useState, useEffect } from 'react';
import { Button, Form, Input, Modal, Space, Switch, Table, Tooltip, Popconfirm } from 'antd';
import { action } from '../../../lib/api';
import { useTr } from '../../../i18n';
import AlertWarning from '../../common/AlertWarning';
import Spinner from '../../common/Spinner';

interface Provider {
  id: string;
  name: string;
  issuer_url: string;
  client_id: string;
  scopes: string;
  enabled: boolean;
}

interface FormState {
  name: string;
  issuer_url: string;
  client_id: string;
  client_secret: string;
  scopes: string;
}

const EMPTY_FORM: FormState = {
  name: 'SSO',
  issuer_url: '',
  client_id: '',
  client_secret: '',
  scopes: 'openid profile email',
};

export default function SettingOidc() {
  const t = useTr();
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  async function loadProviders() {
    try {
      setError(false);
      const res = await fetch('/api/pri/oidc-provider/list', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: '{}',
      });
      if (!res.ok) throw new Error('failed');
      const data = await res.json();
      setProviders(Array.isArray(data) ? data : []);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadProviders(); }, []);

  function openAdd() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setSaveError('');
    setModalOpen(true);
  }

  function openEdit(p: Provider) {
    setEditingId(p.id);
    setForm({
      name: p.name,
      issuer_url: p.issuer_url,
      client_id: p.client_id,
      client_secret: '',
      scopes: p.scopes,
    });
    setSaveError('');
    setModalOpen(true);
  }

  async function handleSave() {
    if (!form.issuer_url.trim() || !form.client_id.trim()) {
      setSaveError('Issuer URL and Client ID are required.');
      return;
    }
    setSaving(true);
    setSaveError('');
    try {
      if (editingId) {
        await action('/api/pri/oidc-provider/update', { id: editingId, ...form });
      } else {
        await action('/api/pri/oidc-provider/add', form);
      }
      setModalOpen(false);
      await loadProviders();
    } catch {
      setSaveError(t('err.update'));
    } finally {
      setSaving(false);
    }
  }

  async function handleToggle(id: string, enabled: boolean) {
    try {
      await action('/api/pri/oidc-provider/toggle', { id, enabled });
      setProviders((prev) => prev.map((p) => p.id === id ? { ...p, enabled } : p));
    } catch {
      setError(true);
    }
  }

  async function handleDelete(id: string) {
    try {
      await action('/api/pri/oidc-provider/del', { id });
      await loadProviders();
    } catch {
      setError(true);
    }
  }

  if (loading) return <Spinner />;

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <p style={{ color: 'var(--color-text-secondary, #666)', marginBottom: 16 }}>
        {t('setting.oidc_hint')}
      </p>

      {error && <AlertWarning type="error">{t('err.generic')}</AlertWarning>}

      <div style={{ marginBottom: 16, textAlign: 'right' }}>
        <Button type="primary" onClick={openAdd}>
          + {t('setting.add_provider')}
        </Button>
      </div>

      {providers.length === 0 ? (
        <div style={{ textAlign: 'center', color: 'var(--color-text-secondary)', padding: '24px 0' }}>
          {t('setting.oidc_no_providers')}
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
        <Table
          dataSource={providers}
          rowKey="id"
          pagination={false}
          columns={[
            {
              title: t('setting.provider_name'),
              dataIndex: 'name',
              key: 'name',
              render: (name: string, record: Provider) => (
                <button
                  type="button"
                  tabIndex={0}
                  style={{ cursor: 'pointer', color: 'var(--ant-color-primary, #1677ff)', background: 'none', border: 'none', padding: 0, font: 'inherit' }}
                  onClick={() => openEdit(record)}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { openEdit(record); } }}
                >
                  {name}
                </button>
              ),
            },
            {
              title: t('form.oidc_issuer_url'),
              dataIndex: 'issuer_url',
              key: 'issuer_url',
              ellipsis: true,
            },
            {
              title: t('form.oidc_client_id'),
              dataIndex: 'client_id',
              key: 'client_id',
              ellipsis: true,
            },
            {
              title: t('form.oidc_scopes'),
              dataIndex: 'scopes',
              key: 'scopes',
              ellipsis: true,
            },
            {
              title: t('setting.provider_enabled'),
              dataIndex: 'enabled',
              key: 'enabled',
              width: 80,
              render: (enabled: boolean, record: Provider) => (
                <Switch
                  checked={enabled}
                  onChange={(val) => handleToggle(record.id, val)}
                />
              ),
            },
            {
              title: '',
              key: 'actions',
              width: 100,
              render: (_: unknown, record: Provider) => (
                <Space>
                  <Tooltip title={t('btn.update')}>
                    <Button onClick={() => openEdit(record)}>✎</Button>
                  </Tooltip>
                  <Popconfirm
                    title={t('setting.confirm_delete_provider')}
                    onConfirm={() => handleDelete(record.id)}
                    okText={t('btn.delete')}
                    cancelText={t('btn.cancel')}
                  >
                    <Button danger>✕</Button>
                  </Popconfirm>
                </Space>
              ),
            },
          ]}
        />
        </div>
      )}

      <Modal
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        title={editingId ? t('setting.edit_provider') : t('setting.add_provider')}
        onOk={handleSave}
        okText={t('btn.submit')}
        cancelText={t('btn.cancel')}
        confirmLoading={saving}
        width={540}
      >
        <Form layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item label={t('setting.provider_name')} required>
            <Input
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              placeholder="Keycloak"
            />
          </Form.Item>
          <Form.Item label={t('form.oidc_issuer_url')} required>
            <Input
              value={form.issuer_url}
              onChange={(e) => setForm((p) => ({ ...p, issuer_url: e.target.value }))}
              placeholder="https://keycloak.example.com/realms/myrealm"
            />
          </Form.Item>
          <Form.Item label={t('form.oidc_client_id')} required>
            <Input
              value={form.client_id}
              onChange={(e) => setForm((p) => ({ ...p, client_id: e.target.value }))}
              placeholder="my-client"
            />
          </Form.Item>
          <Form.Item
            label={t('form.oidc_client_secret')}
            extra={editingId ? t('form.secret_hint') : undefined}
          >
            <Input.Password
              value={form.client_secret}
              onChange={(e) => setForm((p) => ({ ...p, client_secret: e.target.value }))}
              placeholder={editingId ? '••••••••' : ''}
            />
          </Form.Item>
          <Form.Item label={t('form.oidc_scopes')}>
            <Input
              value={form.scopes}
              onChange={(e) => setForm((p) => ({ ...p, scopes: e.target.value }))}
              placeholder="openid profile email"
            />
          </Form.Item>

          {saveError && (
            <AlertWarning type="error">{saveError}</AlertWarning>
          )}
        </Form>
      </Modal>
    </div>
  );
}
