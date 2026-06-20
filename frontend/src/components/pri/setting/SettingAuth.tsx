import { useState, useEffect } from 'react';
import { Form, Input, Button, Switch, Space, Popconfirm, Empty, Modal } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';
import { action, list } from '../../../lib/api';
import { useTr } from '../../../i18n';
import AlertWarning from '../../common/AlertWarning';
import Spinner from '../../common/Spinner';
import FormActions from '../../common/FormActions';

interface OidcProvider {
  id: string;
  name: string;
  issuer_url: string;
  client_id: string;
  scopes: string;
  enabled: boolean;
}

interface Props {
  readonly addOpen?: boolean;
  readonly onAddClose?: () => void;
}

export default function SettingAuth({ addOpen = false, onAddClose }: Props) {
  const t = useTr();
  const [providers, setProviders] = useState<OidcProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const [form] = Form.useForm();

  async function loadProviders() {
    try {
      setError(false);
      const res = await list('/api/pri/oidc-provider/list', 100);
      setProviders(Array.isArray(res) ? res : (res.items ?? []));
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadProviders(); }, []);

  function closeAdd() {
    form.resetFields();
    setSaveError(false);
    onAddClose?.();
  }

  async function onAdd(values: {
    name: string;
    issuer_url: string;
    client_id: string;
    client_secret: string;
    scopes: string;
  }) {
    try {
      setSaveError(false);
      setSaving(true);
      await action('/api/pri/oidc-provider/add', {
        name: values.name || 'SSO',
        issuer_url: values.issuer_url,
        client_id: values.client_id,
        client_secret: values.client_secret || '',
        scopes: values.scopes || 'openid profile email',
      });
      closeAdd();
      await loadProviders();
    } catch {
      setSaveError(true);
    } finally {
      setSaving(false);
    }
  }

  async function onToggle(id: string, enabled: boolean) {
    try {
      await action('/api/pri/oidc-provider/toggle', { id, enabled });
      setProviders((prev) => prev.map((p) => p.id === id ? { ...p, enabled } : p));
    } catch { /* ignore */ }
  }

  async function onDelete(id: string) {
    try {
      await action('/api/pri/oidc-provider/del', { id });
      await loadProviders();
    } catch { /* ignore */ }
  }

  if (loading) return <Spinner />;

  return (
    <div style={{ maxWidth: 960, margin: '0 auto' }}>
      {error && <AlertWarning type="error">{t('err.generic')}</AlertWarning>}

      {providers.length === 0 && !error && (
        <Empty description={t('setting.oidc_no_providers') || 'No SSO providers configured'} />
      )}

      {providers.map((p) => (
        <div
          key={p.id}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 0',
            borderBottom: `1px solid var(--color-border)`,
          }}
        >
          <div>
            <strong>{p.name}</strong>
            <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>{p.issuer_url}</div>
            <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>Client ID: {p.client_id}</div>
          </div>
          <Space>
            <Switch checked={p.enabled} onChange={(v) => onToggle(p.id, v)} />
            <Popconfirm
              title={t('setting.confirm_delete_provider') || 'Delete this provider?'}
              onConfirm={() => onDelete(p.id)}
              okText={t('btn.delete')}
              cancelText={t('btn.cancel')}
            >
              <Button danger icon={<DeleteOutlined />} />
            </Popconfirm>
          </Space>
        </div>
      ))}

      <Modal
        title={t('btn.add')}
        open={addOpen}
        onCancel={closeAdd}
        footer={null}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={onAdd} style={{ marginTop: 8 }}>
          <Form.Item name="name" label={t('setting.provider_name')} initialValue="SSO">
            <Input placeholder="Keycloak" />
          </Form.Item>
          <Form.Item name="issuer_url" label={t('form.oidc_issuer_url')} rules={[{ required: true }]}>
            <Input placeholder="https://keycloak.example.com/realms/myrealm" />
          </Form.Item>
          <Form.Item name="client_id" label={t('form.oidc_client_id')} rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="client_secret" label={t('form.oidc_client_secret')}>
            <Input.Password />
          </Form.Item>
          <Form.Item name="scopes" label={t('form.oidc_scopes')} initialValue="openid profile email">
            <Input placeholder="openid profile email" />
          </Form.Item>
          {saveError && <AlertWarning type="error">{t('err.generic')}</AlertWarning>}
          <FormActions>
            <Button block onClick={closeAdd}>{t('btn.cancel')}</Button>
            <Button type="primary" htmlType="submit" loading={saving} block>{t('btn.add')}</Button>
          </FormActions>
        </Form>
      </Modal>
    </div>
  );
}
