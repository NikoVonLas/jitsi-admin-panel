import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Input, Button, Divider, Alert, Typography, Space } from 'antd';
import { UserOutlined, LockOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import { useTr } from '../i18n';

const { Title, Text } = Typography;

interface OidcProvider { id: string; name: string; }
interface AuthConfig { local: boolean; oidc: boolean; setup: boolean; oidc_providers: OidcProvider[]; }

export default function LoginPage() {
  const t = useTr();
  const navigate = useNavigate();
  const [authConfig, setAuthConfig] = useState<AuthConfig | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    const oidcAuth = sessionStorage.getItem('oidc_authenticated');
    if (token || oidcAuth) { navigate('/meeting', { replace: true }); return; }

    fetch('/api/adm/auth/config', { credentials: 'include' })
      .then((r) => r.json())
      .then((d) => setAuthConfig({
        local: d.local ?? true,
        oidc: d.oidc ?? false,
        setup: d.setup ?? false,
        oidc_providers: Array.isArray(d.oidc_providers) ? d.oidc_providers : [],
      }))
      .catch(() => setAuthConfig({ local: true, oidc: false, setup: false, oidc_providers: [] }));
  }, [navigate]);

  async function onSetup(values: { email: string; password: string; name?: string }) {
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/adm/auth/local/register', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: values.email.trim().toLowerCase(), password: values.password, name: values.name }),
      });
      if (!res.ok) { setError(t('login.err_create_user')); return; }
      const data = await res.json();
      if (data.token) localStorage.setItem('auth_token', data.token);
      sessionStorage.setItem('oidc_authenticated', 'ok');
      navigate('/', { replace: true });
    } catch {
      setError(t('login.err_retry'));
    } finally {
      setLoading(false);
    }
  }

  async function onFinish(values: { email: string; password: string }) {
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/adm/auth/local/login', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: values.email.trim().toLowerCase(), password: values.password }),
      });
      if (!res.ok) { setError(t('login.err_invalid_credentials')); return; }
      const data = await res.json();
      if (data.token) localStorage.setItem('auth_token', data.token);
      sessionStorage.setItem('oidc_authenticated', 'ok');
      navigate('/', { replace: true });
    } catch {
      setError(t('login.err_login'));
    } finally {
      setLoading(false);
    }
  }

  async function handleOidcLogin(provider: OidcProvider) {
    try {
      const res = await fetch('/api/adm/oidc/auth-url', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: 'consent', provider_id: provider.id }),
      });
      const data = await res.json();
      const url = data[0]?.auth_url ?? data?.auth_url;
      if (url) globalThis.location.href = url;
    } catch {
      setError(t('login.err_sso'));
    }
  }

  const hasOidc = authConfig?.oidc && (authConfig.oidc_providers?.length ?? 0) > 0;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px 16px',
      overflowY: 'auto',
    }}>
      <div style={{ width: '100%', maxWidth: 360 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Title level={3} style={{ margin: 0 }}>
            {authConfig?.setup ? t('login.first_run') : t('login.title')}
          </Title>
          {authConfig?.setup && (
            <Text type="secondary" style={{ fontSize: 13 }}>{t('login.setup_hint')}</Text>
          )}
          {authConfig === null && (
            <Text type="secondary" style={{ fontSize: 13 }}>{t('login.loading')}</Text>
          )}
        </div>

        {error && (
          <Alert message={error} type="error" showIcon style={{ marginBottom: 16 }} closable onClose={() => setError('')} />
        )}

        {authConfig?.setup && (
          <Form form={form} layout="vertical" onFinish={onSetup} size="large">
            <Form.Item name="name" rules={[{ required: true, message: t('login.rule_name') }]}>
              <Input prefix={<UserOutlined />} placeholder={t('login.placeholder_name')} autoComplete="name" />
            </Form.Item>
            <Form.Item name="email" rules={[{ required: true, type: 'email', message: t('login.rule_email') }]}>
              <Input prefix={<UserOutlined />} placeholder="Email" autoComplete="email" />
            </Form.Item>
            <Form.Item name="password" rules={[{ required: true, min: 14, message: t('login.rule_password') }]}>
              <Input.Password prefix={<LockOutlined />} placeholder={t('login.placeholder_password')} autoComplete="new-password" />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" block loading={loading}>
                {t('login.create_account')}
              </Button>
            </Form.Item>
          </Form>
        )}

        {!authConfig?.setup && authConfig?.local && (
          <Form form={form} layout="vertical" onFinish={onFinish} size="large">
            <Form.Item name="email" rules={[{ required: true, type: 'email', message: t('login.rule_email') }]}>
              <Input prefix={<UserOutlined />} placeholder="Email" autoComplete="email" />
            </Form.Item>
            <Form.Item name="password" rules={[{ required: true, message: t('login.rule_password_req') }]}>
              <Input.Password prefix={<LockOutlined />} placeholder={t('login.placeholder_password')} autoComplete="current-password" />
            </Form.Item>
            <Form.Item style={{ marginBottom: hasOidc ? 8 : 0 }}>
              <Button type="primary" htmlType="submit" block loading={loading}>
                {t('btn.sign_in')}
              </Button>
            </Form.Item>
          </Form>
        )}

        {authConfig?.local && hasOidc && <Divider plain>{t('login.or')}</Divider>}

        {hasOidc && (
          <Space direction="vertical" style={{ width: '100%' }}>
            {authConfig!.oidc_providers.map((p) => (
              <Button
                key={p.id}
                block
                icon={<SafetyCertificateOutlined />}
                onClick={() => handleOidcLogin(p)}
                disabled={loading}
              >
                {t('login.sign_in_via')} {p.name}
              </Button>
            ))}
          </Space>
        )}
      </div>
    </div>
  );
}
