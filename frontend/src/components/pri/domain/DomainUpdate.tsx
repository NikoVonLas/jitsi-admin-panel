import DomainForm from './DomainForm';

interface Props {
  readonly id: string;
  readonly onCancel?: () => void;
  readonly onDone?: () => void;
}

export default function DomainUpdate({ id, onCancel, onDone }: Props) {
  return <DomainForm domainId={id} onCancel={onCancel} onDone={onDone} />;
}
