import RoomForm from './RoomForm';

interface Props {
  readonly onCancel?: () => void;
  readonly onDone?: () => void;
}

export default function RoomAdd({ onCancel, onDone }: Props) {
  return <RoomForm onCancel={onCancel} onDone={onDone} />;
}
