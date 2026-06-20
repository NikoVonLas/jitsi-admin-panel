import { Checkbox, Form } from 'antd';

interface Props {
  readonly label: string;
  readonly hint?: string;
  readonly checked?: boolean;
  readonly onChange?: (v: boolean) => void;
  readonly disabled?: boolean;
}

export default function FormCheckbox({ label, hint, checked, onChange, disabled }: Props) {
  return (
    <Form.Item help={hint} style={{ marginBottom: 16 }}>
      <Checkbox checked={checked} onChange={(e) => onChange?.(e.target.checked)} disabled={disabled}>
        {label}
      </Checkbox>
    </Form.Item>
  );
}
