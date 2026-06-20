import { useState, useEffect } from 'react';
import { Button, Table, Form, Input, Switch, Modal, Popconfirm } from 'antd';
import FormActions from '../../common/FormActions';
import { DeleteOutlined } from '@ant-design/icons';
import { list as apiList, action } from '../../../lib/api';
import { useTr } from '../../../i18n';
import AlertWarning from '../../common/AlertWarning';

interface Props {
  readonly addOpen?: boolean;
  readonly onAddClose?: () => void;
}

interface LocalUser {
  id: string;
  email: string;
  is_superadmin: boolean;
  created_at: string;
}

export default function SettingUsers({ addOpen = false, onAddClose }: Props) {
  const t = useTr();
  const [users, setUsers] = useState<LocalUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const [form] = Form.useForm();

  async function load() {
    setLoading(true);
    setError(false);
    try {
      const rows = await apiList('/api/pri/user/list', 1000);
      setUsers(rows as LocalUser[]);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  function closeAdd() {
    form.resetFields();
    setSaveError(false);
    onAddClose?.();
  }

  async function handleAdd(values: { email: string; password: string; name?: string; is_superadmin?: boolean }) {
    setSaving(true);
    setSaveError(false);
    try {
      await action('/api/pri/user/add', {
        email: values.email,
        password: values.password,
        name: values.name || '',
        is_superadmin: values.is_superadmin === true,
      });
      closeAdd();
      await load();
    } catch {
      setSaveError(true);
    } finally {
      setSaving(false);
    }
  }

  async function handleDel(id: string) {
    try {
      await action('/api/pri/user/del', { id });
      await load();
    } catch {
      setError(true);
    }
  }

  async function handleSetAdmin(id: string, value: boolean) {
    try {
      await action('/api/pri/user/set-admin', { id, is_superadmin: value });
      setUsers((prev) => prev.map((u) => u.id === id ? { ...u, is_superadmin: value } : u));
    } catch {
      setError(true);
    }
  }

  const columns = [
    {
      title: t('user.email'),
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: t('user.is_admin'),
      key: 'is_superadmin',
      render: (_: unknown, record: LocalUser) => (
        <Switch
          checked={record.is_superadmin}
          onChange={(v) => handleSetAdmin(record.id, v)}
        />
      ),
    },
    {
      title: t('user.created'),
      key: 'created_at',
      render: (_: unknown, record: LocalUser) =>
        new Date(record.created_at).toLocaleDateString(),
    },
    {
      title: '',
      key: 'actions',
      render: (_: unknown, record: LocalUser) => (
        <Popconfirm
          title={t('user.del_confirm')}
          onConfirm={() => handleDel(record.id)}
          okType="danger"
        >
          <Button icon={<DeleteOutlined />} danger type="text" />
        </Popconfirm>
      ),
    },
  ];

  return (
    <div style={{ maxWidth: 960, margin: '0 auto' }}>

      {error && <AlertWarning type="error">{t('user.err_del')}</AlertWarning>}

      <div style={{ overflowX: 'auto' }}>
        <Table
          dataSource={users}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={false}
          locale={{ emptyText: t('user.no_users') }}
        />
      </div>

      <Modal
        title={t('user.add')}
        open={addOpen}
        onCancel={closeAdd}
        footer={null}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleAdd} style={{ marginTop: 16 }}>
          <Form.Item name="email" label={t('user.email')} rules={[{ required: true, type: 'email' }]}>
            <Input autoComplete="off" />
          </Form.Item>
          <Form.Item name="name" label={t('user.name')}>
            <Input autoComplete="off" />
          </Form.Item>
          <Form.Item
            name="password"
            label={t('user.password')}
            rules={[{ required: true, min: 14, message: t('login.rule_password') }]}
          >
            <Input.Password autoComplete="new-password" />
          </Form.Item>
          <Form.Item name="is_superadmin" label={t('user.is_admin')} valuePropName="checked">
            <Switch />
          </Form.Item>
          {saveError && <AlertWarning type="error">{t('user.err_add')}</AlertWarning>}
          <FormActions>
            <Button block onClick={closeAdd}>{t('btn.cancel')}</Button>
            <Button type="primary" htmlType="submit" loading={saving} block>{t('user.add')}</Button>
          </FormActions>
        </Form>
      </Modal>
    </div>
  );
}
