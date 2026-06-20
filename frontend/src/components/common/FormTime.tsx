import { Form, TimePicker } from 'antd';
import ruRU from 'antd/locale/ru_RU';
import enUS from 'antd/locale/en_US';
import dayjs from 'dayjs';
import { usePrefStore } from '../../store/pref';
import { useI18n } from '../../i18n';

interface Props {
  readonly name: string;
  readonly label: string;
  readonly required?: boolean;
  readonly value?: string;
  readonly onChange?: (v: string) => void;
  readonly disabled?: boolean;
}

export default function FormTime({ name, label, required, value, onChange, disabled }: Props) {
  const storeLang = usePrefStore((s) => s.lang);
  const { lang: i18nLang } = useI18n();
  const lang = storeLang ?? i18nLang;
  const locale = lang === 'ru' ? ruRU.DatePicker : enUS.DatePicker;

  return (
    <Form.Item label={label} required={required} style={{ marginBottom: 16 }}>
      <TimePicker
        id={name}
        locale={locale}
        value={value ? dayjs(`2000-01-01T${value}`) : null}
        onChange={(t) => onChange?.(t ? t.format('HH:mm') : '')}
        disabled={disabled}
        style={{ width: '100%' }}
        format="HH:mm"
        showSecond={false}
      />
    </Form.Item>
  );
}
