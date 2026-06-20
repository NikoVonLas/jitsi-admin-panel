import type { Room } from '../../../types';
import RoomForm from './RoomForm';

interface Props {
  readonly room: Room;
  readonly onCancel?: () => void;
  readonly onDone?: () => void;
}

export default function RoomUpdate({ room, onCancel, onDone }: Props) {
  return (
    <RoomForm
      initialRoom={{
        id: room.id,
        label: room.label,
        slug: room.name,
        domainId: room.domain_id,
        hasSuffix: room.has_suffix,
      }}
      onCancel={onCancel}
      onDone={onDone}
    />
  );
}
