import { Form, ColorPicker, Input, Space } from 'antd';

interface Props {
  readonly name: string;
  readonly label: string;
  readonly value: string;
  readonly defaultValue?: string;
  readonly onChange?: (v: string) => void;
}

export default function FormColor({ name, label, value, defaultValue = '', onChange }: Props) {
  const hex = value || '#000000';

  return (
    <Form.Item label={label} style={{ marginBottom: 16 }}>
      <Space.Compact style={{ width: '100%' }}>
        <ColorPicker
          value={hex}
          onChange={(_, hexStr) => onChange?.(hexStr)}
          showText={false}
        />
        <Input
          id={name}
          name={name}
          value={value}
          placeholder="#000000"
          style={{ flex: 1 }}
          onChange={(e) => onChange?.(e.target.value)}
        />
        {value && defaultValue !== undefined && (
          <button
            type="button"
            onClick={() => onChange?.(defaultValue)}
            style={{
              border: '1px solid var(--color-border)',
              background: 'var(--color-bg)',
              cursor: 'pointer',
              padding: '0 8px',
              borderRadius: '0 6px 6px 0',
              color: 'var(--color-text-secondary)',
            }}
          >
            ×
          </button>
        )}
      </Space.Compact>
    </Form.Item>
  );
}
