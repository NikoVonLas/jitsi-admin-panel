import { useState } from 'react';
import { Space } from 'antd';
import { useNavigate } from 'react-router-dom';
import { actionById } from '../../../lib/api';
import type { Profile } from '../../../types';
import ButtonCancel from '../../common/ButtonCancel';
import ButtonSubmit from '../../common/ButtonSubmit';

interface Props {
  readonly profile: Profile;
  readonly endpoint: string;
  readonly alertNode: React.ReactNode;
  readonly errorNode: React.ReactNode;
  readonly submitLabel: string;
  readonly danger?: boolean;
}

export default function ProfileConfirmAction({
  profile,
  endpoint,
  alertNode,
  errorNode,
  submitLabel,
  danger,
}: Props) {
  const navigate = useNavigate();
  const [warning, setWarning] = useState(false);
  const [disabled, setDisabled] = useState(false);

  async function onSubmit() {
    try {
      setWarning(false);
      setDisabled(true);
      await actionById(endpoint, profile.id);
      navigate('/profile');
    } catch {
      setWarning(true);
      setDisabled(false);
    }
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'center', marginTop: 16 }}>
      <div style={{ width: '100%', maxWidth: 540 }}>
        <p><strong>{profile.name}</strong></p>
        {warning ? errorNode : alertNode}
        <Space>
          <ButtonCancel onClick={() => navigate('/profile')} disabled={disabled} />
          <ButtonSubmit onClick={onSubmit} disabled={disabled} label={submitLabel} danger={danger} />
        </Space>
      </div>
    </div>
  );
}
