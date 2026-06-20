import { Form, Input } from 'antd';

interface Props {
  readonly disabled?: boolean;
  readonly label: string;
  readonly name: string;
  readonly onInput?: () => void;
  readonly readOnly?: boolean;
  readonly required?: boolean;
  readonly value: string;
  readonly onChange?: (v: string) => void;
}

export default function FormText({
  disabled = false,
  label,
  name,
  onInput,
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
        value={value}
        disabled={disabled}
        readOnly={readOnly}
        onChange={(e) => onChange?.(e.target.value)}
        onInput={onInput}
      />
    </Form.Item>
  );
}
