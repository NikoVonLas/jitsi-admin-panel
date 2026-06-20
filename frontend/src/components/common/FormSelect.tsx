import { Form, Select } from 'antd';

interface Props {
  readonly name: string;
  readonly label: string;
  readonly required?: boolean;
  readonly value?: string;
  readonly onChange?: (v: string) => void;
  readonly options: readonly [string, string][];
  readonly disabled?: boolean;
}

export default function FormSelect({ name, label, required, value, onChange, options, disabled }: Props) {
  return (
    <Form.Item label={label} required={required} style={{ marginBottom: 16 }}>
      <Select
        id={name}
        value={value}
        onChange={onChange}
        disabled={disabled}
        options={options.map(([v, l]) => ({ value: v, label: l }))}
        style={{ width: '100%' }}
      />
    </Form.Item>
  );
}
