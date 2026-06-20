import { Form, Radio } from 'antd';

interface Props {
  readonly label?: string;
  readonly value?: string;
  readonly onChange?: (v: string) => void;
  readonly options: readonly [string, string][];
  readonly disabled?: boolean;
}

export default function FormRadio({ label, value, onChange, options, disabled }: Props) {
  return (
    <Form.Item label={label} style={{ marginBottom: 16 }}>
      <Radio.Group
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        disabled={disabled}
      >
        {options.map(([v, l]) => (
          <Radio key={v} value={v}>
            {l}
          </Radio>
        ))}
      </Radio.Group>
    </Form.Item>
  );
}
