import { Form, Input } from 'antd';

interface Props {
  readonly disabled?: boolean;
  readonly label: string;
  readonly name: string;
  readonly readOnly?: boolean;
  readonly required?: boolean;
  readonly value: string;
  readonly onChange?: (v: string) => void;
}

export default function FormEmail({
  disabled = false,
  label,
  name,
  readOnly = false,
  required = false,
  value,
  onChange,
}: Props) {
  return (
    <Form.Item label={label} required={required} style={{ marginBottom: 16 }}>
      <Input
        id={name}
        name={name}
        type="email"
        value={value}
        disabled={disabled}
        readOnly={readOnly}
        onChange={(e) => onChange?.(e.target.value)}
      />
    </Form.Item>
  );
}
