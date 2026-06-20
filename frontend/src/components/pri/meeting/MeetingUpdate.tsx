import { useState } from 'react';
import { Form } from 'antd';
import { action } from '../../../lib/api';
import { useTr } from '../../../i18n';
import type { Meeting } from '../../../types';
import AlertWarning from '../../common/AlertWarning';
import ButtonCancel from '../../common/ButtonCancel';
import ButtonSubmit from '../../common/ButtonSubmit';
import FormActions from '../../common/FormActions';
import FormText from '../../common/FormText';
import FormTextarea from '../../common/FormTextarea';

interface Props {
  readonly meeting: Meeting;
  readonly onDone?: () => void;
}

export default function MeetingUpdate({ meeting, onDone }: Props) {
  const t = useTr();
  const [warning, setWarning] = useState(false);
  const [disabled, setDisabled] = useState(false);
  const [name, setName] = useState(meeting.name);
  const [info, setInfo] = useState(meeting.info);

  async function onFinish() {
    try {
      setWarning(false);
      setDisabled(true);
      await action('/api/pri/meeting/update', {
        id: meeting.id,
        name,
        info,
        profile_id: meeting.profile_id,
        room_id: meeting.room_id,
        hidden: meeting.hidden,
        subscribable: meeting.subscribable,
      });
      onDone?.();
    } catch {
      setWarning(true);
      setDisabled(false);
    }
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'center' }}>
      <div style={{ width: '100%', maxWidth: 540 }}>
        <Form layout="vertical" onFinish={onFinish}>
          <FormText name="name" label={t('form.name')} value={name} onChange={setName} required disabled={disabled} />
          <FormTextarea name="info" label={t('form.info')} value={info} onChange={setInfo} disabled={disabled} />

          {warning && <AlertWarning type="error">{t('err.update')}</AlertWarning>}

          <FormActions>
            <ButtonCancel onClick={onDone} disabled={disabled} block />
            <ButtonSubmit disabled={disabled} label={t('btn.update')} block />
          </FormActions>
        </Form>
      </div>
    </div>
  );
}
