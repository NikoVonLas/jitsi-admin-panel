import DomainForm from './DomainForm';

interface Props {
  readonly onCancel?: () => void;
  readonly onDone?: () => void;
}

export default function DomainAdd({ onCancel, onDone }: Props) {
  return <DomainForm onCancel={onCancel} onDone={onDone} />;
}
