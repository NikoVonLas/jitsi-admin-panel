import { Button } from 'antd';
import { useTr } from '../../i18n';

interface Props {
  readonly disabled?: boolean;
  readonly label?: string;
  readonly loading?: boolean;
  readonly htmlType?: 'submit' | 'button' | 'reset';
  readonly onClick?: () => void;
  readonly danger?: boolean;
  readonly block?: boolean;
}

export default function ButtonSubmit({
  disabled,
  label,
  loading,
  htmlType = 'submit',
  onClick,
  danger,
  block,
}: Props) {
  const t = useTr();
  return (
    <Button
      type="primary"
      htmlType={htmlType}
      disabled={disabled}
      loading={loading}
      onClick={onClick}
      danger={danger}
      block={block}
    >
      {label ?? t('btn.submit')}
    </Button>
  );
}
