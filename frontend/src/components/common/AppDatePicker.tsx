import { DatePicker } from 'antd';
import ruRU from 'antd/locale/ru_RU';
import enUS from 'antd/locale/en_US';
import dayjs from 'dayjs';
import 'dayjs/locale/ru';
import 'dayjs/locale/en';
import { usePrefStore } from '../../store/pref';
import { useI18n } from '../../i18n';

interface Props {
  readonly value?: string | null;
  readonly onChange?: (v: string) => void;
  readonly allowClear?: boolean;
  readonly disabled?: boolean;
  readonly style?: React.CSSProperties;
  readonly placeholder?: string;
}

export default function AppDatePicker({ value, onChange, allowClear, disabled, style, placeholder }: Props) {
  const storeLang = usePrefStore((s) => s.lang);
  const { lang: i18nLang } = useI18n();
  const lang = storeLang ?? i18nLang;
  const isRu = lang === 'ru';

  const locale = isRu ? ruRU.DatePicker : enUS.DatePicker;
  const fmt = isRu ? 'DD.MM.YYYY' : 'MM/DD/YYYY';

  return (
    <DatePicker
      locale={locale}
      format={fmt}
      value={value ? dayjs(value) : null}
      onChange={(d) => onChange?.(d ? d.format('YYYY-MM-DD') : '')}
      allowClear={allowClear}
      disabled={disabled}
      style={style}
      placeholder={placeholder}
    />
  );
}
