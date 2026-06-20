import { Select } from 'antd';

interface Option {
  readonly value: string;
  readonly label: string;
}

interface Props {
  readonly options: readonly Option[];
  readonly value: string;
  readonly allLabel?: string;
  readonly onChange: (value: string) => void;
  readonly style?: React.CSSProperties;
  readonly placeholder?: string;
}

export default function SelectSearch({ options, value, allLabel, onChange, style, placeholder }: Props) {
  const opts = [
    ...(allLabel ? [{ value: '', label: allLabel }] : []),
    ...options,
  ];

  return (
    <Select
      value={value || ''}
      onChange={onChange}
      options={opts}
      style={{ minWidth: 140, ...style }}
      placeholder={placeholder}
      showSearch
      filterOption={(input, option) =>
        (option?.label as string)?.toLowerCase().includes(input.toLowerCase())
      }
    />
  );
}
