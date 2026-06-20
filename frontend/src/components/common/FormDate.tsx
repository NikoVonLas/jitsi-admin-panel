import { Form } from 'antd';
import AppDatePicker from './AppDatePicker';

interface Props {
  readonly name: string;
  readonly label: string;
  readonly required?: boolean;
  readonly value?: string;
  readonly onChange?: (v: string) => void;
  readonly disabled?: boolean;
}

export default function FormDate({ name, label, required, value, onChange, disabled }: Props) {
  return (
    <Form.Item label={label} required={required} style={{ marginBottom: 16 }}>
      <AppDatePicker
        value={value}
        onChange={onChange}
        disabled={disabled}
        style={{ width: '100%' }}
      />
    </Form.Item>
  );
}
