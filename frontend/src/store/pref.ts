import { create } from 'zustand';
import { get as apiGet, action } from '../lib/api';
import { useI18n, type Lang } from '../i18n';

export type Theme = 'system' | 'light' | 'dark';

interface PrefStore {
  lang: Lang | null;
  theme: Theme;
  loaded: boolean;
  load: () => Promise<void>;
  setLang: (lang: Lang) => Promise<void>;
  setTheme: (theme: Theme) => Promise<void>;
}

export const usePrefStore = create<PrefStore>((set, get) => ({
  lang: null,
  theme: 'system',
  loaded: false,

  load: async () => {
    if (get().loaded) return;
    set({ loaded: true });
    try {
      const pref = await apiGet('/api/pri/pref/get');
      const lang = (pref.pref_lang as Lang) || null;
      const theme = (pref.pref_theme as Theme) || 'system';
      set({ lang, theme });
      if (lang) useI18n.getState().setLang(lang);
    } catch {
      // keep browser-detected lang
    }
  },

  setLang: async (lang: Lang) => {
    const { theme } = get();
    set({ lang });
    useI18n.getState().setLang(lang);
    try {
      await action('/api/pri/pref/update', { lang, theme });
    } catch {
      // ignore
    }
  },

  setTheme: async (theme: Theme) => {
    const { lang } = get();
    set({ theme });
    try {
      await action('/api/pri/pref/update', { lang: lang ?? 'en', theme });
    } catch {
      // ignore
    }
  },
}));
