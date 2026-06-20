import { Form, Input } from 'antd';
import type { Control } from 'react-hook-form';
import { Controller } from 'react-hook-form';

interface Props {
  readonly name: string;
  readonly label: string;
  readonly control?: Control<any>;
  readonly required?: boolean;
  readonly placeholder?: string;
  readonly value?: string;
  readonly onChange?: (v: string) => void;
  readonly disabled?: boolean;
}

export default function FormUrl({ name, label, control, required, placeholder, value, onChange, disabled }: Props) {
  if (control) {
    return (
      <Controller
        name={name}
        control={control}
        render={({ field, fieldState }) => (
          <Form.Item
            label={label}
            required={required}
            validateStatus={fieldState.error ? 'error' : ''}
            help={fieldState.error?.message}
            style={{ marginBottom: 16 }}
          >
            <Input {...field} type="url" placeholder={placeholder} disabled={disabled} />
          </Form.Item>
        )}
      />
    );
  }
  return (
    <Form.Item label={label} required={required} style={{ marginBottom: 16 }}>
      <Input
        type="url"
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
      />
    </Form.Item>
  );
}
