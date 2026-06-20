import { useTr } from '../../../i18n';
import FormText from '../../common/FormText';
import FormTextarea from '../../common/FormTextarea';
import FormSelect from '../../common/FormSelect';

interface Props {
  readonly name: string;
  readonly onNameChange: (v: string) => void;
  readonly info: string;
  readonly onInfoChange: (v: string) => void;
  readonly roomId: string;
  readonly onRoomIdChange: (v: string) => void;
  readonly rooms: [string, string][];
  readonly disabled?: boolean;
}

export default function MeetingFields({
  name, onNameChange, info, onInfoChange,
  roomId, onRoomIdChange, rooms, disabled,
}: Props) {
  const t = useTr();
  return (
    <>
      <FormText name="name" label={t('form.name')} value={name} onChange={onNameChange} required disabled={disabled} />
      <FormTextarea name="info" label={t('form.info')} value={info} onChange={onInfoChange} disabled={disabled} />
      <FormSelect name="room_id" label={t('form.room')} value={roomId} onChange={onRoomIdChange} options={rooms} disabled={disabled} required />
    </>
  );
}
