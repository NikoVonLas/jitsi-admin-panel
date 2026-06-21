import { create } from 'zustand';
import { get as apiGet, action } from '../lib/api';
import { useI18n, type Lang } from '../i18n';

export type Theme = 'system' | 'light' | 'dark';

// Detect the locale-preferred first day of week (0 = Sunday, 1 = Monday).
// Falls back to 1 (Monday) when the Intl.Locale weekInfo API is unavailable.
function browserWeekStart(): number {
  try {
    const locale = new Intl.Locale(navigator.language);
    // weekInfo is a stage-3 proposal, available in modern browsers
    const info = (locale as unknown as { weekInfo?: { firstDay: number } }).weekInfo;
    if (info != null) {
      // Intl returns 7 for Sunday; normalise to 0
      return info.firstDay === 7 ? 0 : info.firstDay;
    }
  } catch {
    // ignore
  }
  return 1;
}

function applyWeekStart(value: number) {
  try {
    localStorage.setItem('week_start', String(value));
  } catch {
    // ignore
  }
}

interface PrefStore {
  lang: Lang | null;
  theme: Theme;
  weekStart: number | null;
  loaded: boolean;
  load: () => Promise<void>;
  setLang: (lang: Lang) => Promise<void>;
  setTheme: (theme: Theme) => Promise<void>;
  setWeekStart: (weekStart: number | null) => Promise<void>;
}

export const usePrefStore = create<PrefStore>((set, get) => ({
  lang: null,
  theme: 'system',
  weekStart: null,
  loaded: false,

  load: async () => {
    if (get().loaded) return;
    set({ loaded: true });
    try {
      const pref = await apiGet('/api/pri/pref/get');
      const lang = (pref.pref_lang as Lang) || null;
      const theme = (pref.pref_theme as Theme) || 'system';
      const weekStart = pref.pref_week_start != null ? Number(pref.pref_week_start) : null;
      set({ lang, theme, weekStart });
      if (lang) useI18n.getState().setLang(lang);
      applyWeekStart(weekStart ?? browserWeekStart());
    } catch {
      // keep browser-detected defaults
      applyWeekStart(browserWeekStart());
    }
  },

  setLang: async (lang: Lang) => {
    const { theme, weekStart } = get();
    set({ lang });
    useI18n.getState().setLang(lang);
    try {
      await action('/api/pri/pref/update', {
        lang,
        theme,
        week_start: weekStart,
      });
    } catch {
      // ignore
    }
  },

  setTheme: async (theme: Theme) => {
    const { lang, weekStart } = get();
    set({ theme });
    try {
      await action('/api/pri/pref/update', {
        lang: lang ?? 'en',
        theme,
        week_start: weekStart,
      });
    } catch {
      // ignore
    }
  },

  setWeekStart: async (weekStart: number | null) => {
    const { lang, theme } = get();
    set({ weekStart });
    applyWeekStart(weekStart ?? browserWeekStart());
    try {
      await action('/api/pri/pref/update', {
        lang: lang ?? 'en',
        theme,
        week_start: weekStart,
      });
    } catch {
      // ignore
    }
  },
}));
