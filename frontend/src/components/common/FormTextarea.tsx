import { Form, Input } from 'antd';

interface Props {
  readonly disabled?: boolean;
  readonly label: string;
  readonly name: string;
  readonly readOnly?: boolean;
  readonly required?: boolean;
  readonly value: string;
  readonly onChange?: (v: string) => void;
  readonly rows?: number;
}

export default function FormTextarea({
  disabled = false,
  label,
  name,
  readOnly = false,
  required = false,
  value,
  onChange,
  rows = 4,
}: Props) {
  return (
    <Form.Item label={label} required={required} style={{ marginBottom: 16 }}>
      <Input.TextArea
        id={name}
        name={name}
        value={value}
        disabled={disabled}
        readOnly={readOnly}
        rows={rows}
        onChange={(e) => onChange?.(e.target.value)}
      />
    </Form.Item>
  );
}
