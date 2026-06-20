import { useState, useCallback } from 'react';
import { Input } from 'antd';
import { useTr } from '../../i18n';
import { listByValue } from '../../lib/api';

interface Props {
  readonly value: string;
  readonly onChange: (id: string) => void;
}

export default function FilterUser({ value, onChange }: Props) {
  const t = useTr();
  const [inputValue, setInputValue] = useState(value);
  let timer: ReturnType<typeof setTimeout>;

  const handleSearch = useCallback(
    (v: string) => {
      setInputValue(v);
      clearTimeout(timer);
      if (!v) {
        onChange('');
        return;
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
      timer = setTimeout(async () => {
        try {
          const rows = await listByValue('/api/pri/identity/list/byemail', v, 1);
          if (rows[0]) onChange(rows[0].id);
          else onChange('');
        } catch {
          onChange('');
        }
      }, 400);
    },
    [onChange]
  );

  return (
    <Input
      placeholder={t('filter.user_placeholder')}
      value={inputValue}
      onChange={(e) => handleSearch(e.target.value)}
      style={{ maxWidth: 200 }}
      allowClear
    />
  );
}
