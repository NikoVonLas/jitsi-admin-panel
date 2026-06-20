import { Button } from 'antd';
import { useTr } from '../../i18n';

interface Props {
  readonly onClick?: () => void;
  readonly disabled?: boolean;
  readonly label?: string;
  readonly block?: boolean;
}

export default function ButtonCancel({ onClick, disabled, label, block }: Props) {
  const t = useTr();
  return (
    <Button onClick={onClick} disabled={disabled} block={block}>
      {label ?? t('btn.cancel')}
    </Button>
  );
}
