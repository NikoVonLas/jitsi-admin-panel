import { useState } from 'react';
import { Form } from 'antd';
import { action } from '../../../lib/api';
import { isRoomNameTaken } from '../../../lib/apiError';
import { useTr } from '../../../i18n';
import AlertWarning from '../../common/AlertWarning';
import ButtonCancel from '../../common/ButtonCancel';
import ButtonSubmit from '../../common/ButtonSubmit';
import FormActions from '../../common/FormActions';
import RoomFields from './RoomFields';

interface InitialRoom {
  readonly id: string;
  readonly label: string;
  readonly slug: string;
  readonly domainId: string;
  readonly hasSuffix: boolean;
}

interface Props {
  readonly onCancel?: () => void;
  readonly onDone?: () => void;
  readonly initialRoom?: InitialRoom;
}

export default function RoomForm({ onCancel, onDone, initialRoom }: Props) {
  const t = useTr();
  const isUpdate = initialRoom !== undefined;
  const [error, setError] = useState<string | null>(null);
  const [disabled, setDisabled] = useState(false);
  const [label, setLabel] = useState(initialRoom?.label ?? '');
  const [slug, setSlug] = useState(initialRoom?.slug ?? '');
  const [domainId, setDomainId] = useState(initialRoom?.domainId ?? '');

  async function onFinish() {
    try {
      setError(null);
      setDisabled(true);
      if (isUpdate) {
        await action('/api/pri/room/update', {
          id: initialRoom.id,
          label,
          name: slug,
          domain_id: domainId,
          has_suffix: initialRoom.hasSuffix,
        });
      } else {
        await action('/api/pri/room/add', {
          label,
          name: slug,
          domain_id: domainId,
          has_suffix: false,
        });
      }
      onDone?.();
    } catch (e) {
      if (isRoomNameTaken(e)) setError('err.room_name_taken');
      else setError(isUpdate ? 'err.update' : 'err.add');
      setDisabled(false);
    }
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'center' }}>
      <div style={{ width: '100%', maxWidth: 540 }}>
        <Form layout="vertical" onFinish={onFinish}>
          <RoomFields
            label={label}
            onLabelChange={setLabel}
            slug={slug}
            onSlugChange={setSlug}
            domainId={domainId}
            onDomainIdChange={setDomainId}
            disabled={disabled}
          />

          {error && <AlertWarning type="error">{t(error)}</AlertWarning>}

          <FormActions>
            <ButtonCancel onClick={onCancel} disabled={disabled} block />
            <ButtonSubmit
              disabled={disabled}
              label={t(isUpdate ? 'btn.update' : 'btn.add')}
              block
            />
          </FormActions>
        </Form>
      </div>
    </div>
  );
}
