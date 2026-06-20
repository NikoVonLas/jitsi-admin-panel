import { create } from 'zustand';
import en from './en';
import ru from './ru';

export type Lang = 'en' | 'ru';

function detectLang(): Lang {
  const browser = (navigator.languages?.[0] ?? navigator.language ?? 'en').toLowerCase();
  return browser.startsWith('ru') ? 'ru' : 'en';
}

const translations: Record<Lang, Record<string, string>> = { en, ru };

interface I18nStore {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: string) => string;
}

export const useI18n = create<I18nStore>((set, get) => ({
  lang: detectLang(),
  setLang: (lang: Lang) => {
    set({ lang });
  },
  t: (key: string) => {
    const { lang } = get();
    return translations[lang]?.[key] ?? translations.en[key] ?? key;
  },
}));

export const t = (key: string): string => useI18n.getState().t(key);
export const useTr = () => useI18n((s) => s.t);

export function pluralRu(n: number, one: string, few: string, many: string): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 14) return many;
  if (mod10 === 1) return one;
  if (mod10 >= 2 && mod10 <= 4) return few;
  return many;
}
