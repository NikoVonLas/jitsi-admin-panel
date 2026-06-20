import { useState } from 'react';
import { Form, Space } from 'antd';
import { useNavigate } from 'react-router-dom';
import { action } from '../../../lib/api';
import { useTr } from '../../../i18n';
import AlertWarning from '../../common/AlertWarning';
import FormText from '../../common/FormText';
import FormEmail from '../../common/FormEmail';
import ButtonCancel from '../../common/ButtonCancel';
import ButtonSubmit from '../../common/ButtonSubmit';

export default function ProfileAdd() {
  const t = useTr();
  const navigate = useNavigate();
  const [warning, setWarning] = useState(false);
  const [disabled, setDisabled] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  async function onFinish() {
    try {
      setWarning(false);
      setDisabled(true);
      await action('/api/pri/profile/add', { name, email });
      navigate('/profile');
    } catch {
      setWarning(true);
      setDisabled(false);
    }
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'center', marginTop: 16 }}>
      <div style={{ width: '100%', maxWidth: 540 }}>
        <Form layout="vertical" onFinish={onFinish}>
          <FormText name="name" label={t('form.name')} value={name} onChange={setName} required disabled={disabled} />
          <FormEmail name="email" label={t('form.email_optional')} value={email} onChange={setEmail} required={false} disabled={disabled} />

          {warning && <AlertWarning type="error">{t('err.add')}</AlertWarning>}

          <Form.Item style={{ marginTop: 32 }}>
            <Space style={{ justifyContent: 'center', width: '100%' }}>
              <ButtonCancel onClick={() => navigate('/profile')} disabled={disabled} />
              <ButtonSubmit disabled={disabled} label={t('btn.add')} />
            </Space>
          </Form.Item>
        </Form>
      </div>
    </div>
  );
}
