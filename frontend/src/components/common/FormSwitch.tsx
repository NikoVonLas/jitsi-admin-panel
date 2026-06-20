import { Form, Switch } from 'antd';

interface Props {
  readonly label: string;
  readonly hint?: string;
  readonly checked?: boolean;
  readonly onChange?: (v: boolean) => void;
  readonly disabled?: boolean;
}

export default function FormSwitch({ label, hint, checked, onChange, disabled }: Props) {
  return (
    <Form.Item label={label} help={hint} style={{ marginBottom: 16 }}>
      <Switch checked={checked} onChange={onChange} disabled={disabled} />
    </Form.Item>
  );
}
