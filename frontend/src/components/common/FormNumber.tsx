import { Form, InputNumber } from 'antd';

interface Props {
  readonly name: string;
  readonly label: string;
  readonly required?: boolean;
  readonly value?: number;
  readonly onChange?: (v: number) => void;
  readonly disabled?: boolean;
  readonly min?: number;
  readonly max?: number;
}

export default function FormNumber({ name, label, required, value, onChange, disabled, min, max }: Props) {
  return (
    <Form.Item label={label} required={required} style={{ marginBottom: 16 }}>
      <InputNumber
        id={name}
        value={value}
        onChange={(v) => v !== null && onChange?.(v)}
        disabled={disabled}
        min={min}
        max={max}
        style={{ width: '100%' }}
      />
    </Form.Item>
  );
}
