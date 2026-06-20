// Simple i18n mock — returns the key as the translation
export const t = (key: string) => key;
export const useTr = () => t;
export const useI18n = () => ({ lang: 'en', setLang: () => {}, t });
export const pluralRu = (_n: number, one: string) => one;
export type Lang = 'en' | 'ru';
