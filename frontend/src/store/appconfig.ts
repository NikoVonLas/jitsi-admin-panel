import { create } from 'zustand';

export interface AppConfig {
  logo_url: string;
  favicon_html: string;
  color_bg_light: string;
  color_bg_dark: string;
  color_text_light: string;
  color_text_dark: string;
  color_link_light: string;
  color_link_dark: string;
  color_navbar_light: string;
  color_navbar_dark: string;
}

const defaultConfig: AppConfig = {
  logo_url: '', favicon_html: '',
  color_bg_light: '', color_bg_dark: '',
  color_text_light: '', color_text_dark: '',
  color_link_light: '', color_link_dark: '',
  color_navbar_light: '', color_navbar_dark: '',
};

function getCachedConfig(): AppConfig {
  try {
    const cached = JSON.parse(localStorage.getItem('galaxy-config') || 'null');
    if (cached) return { ...defaultConfig, ...cached };
  } catch {}
  return defaultConfig;
}

interface AppConfigStore {
  config: AppConfig;
  setConfig: (cfg: AppConfig) => void;
  load: () => Promise<void>;
}

let dynamicStyleEl: HTMLStyleElement | null = null;
let appliedFaviconHtml = '';

export function applyFavicon(html: string) {
  if (typeof document === 'undefined' || html === appliedFaviconHtml) return;
  appliedFaviconHtml = html;
  document.querySelectorAll('link[data-gx-fav]').forEach((el) => el.remove());
  if (!html) return;
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  tmp.querySelectorAll('link, meta').forEach((node) => {
    (node as HTMLElement).dataset.gxFav = '';
    document.head.appendChild(node);
  });
}

export function applyConfig(cfg: Partial<AppConfig>) {
  if (!dynamicStyleEl) {
    dynamicStyleEl = document.createElement('style');
    dynamicStyleEl.id = 'galaxy-dynamic-theme';
    document.head.appendChild(dynamicStyleEl);
  }
  try {
    localStorage.setItem('galaxy-config', JSON.stringify(cfg));
  } catch {}
}

export const useAppConfig = create<AppConfigStore>((set) => ({
  config: getCachedConfig(),
  setConfig: (cfg: AppConfig) => {
    set({ config: cfg });
    applyConfig(cfg);
    applyFavicon(cfg.favicon_html);
  },
  load: async () => {
    try {
      const res = await fetch('/api/pub/hello', { method: 'POST', body: '{}' });
      const data = await res.json();
      const cfg: AppConfig = {
        logo_url: data.logo_url || '',
        favicon_html: data.favicon_html || '',
        color_bg_light: data.color_bg_light || '',
        color_bg_dark: data.color_bg_dark || '',
        color_text_light: data.color_text_light || '',
        color_text_dark: data.color_text_dark || '',
        color_link_light: data.color_link_light || '',
        color_link_dark: data.color_link_dark || '',
        color_navbar_light: data.color_navbar_light || '',
        color_navbar_dark: data.color_navbar_dark || '',
      };
      set({ config: cfg });
      applyConfig(cfg);
      applyFavicon(cfg.favicon_html);
      if (data.galaxy_fqdn) localStorage.setItem('galaxy_fqdn', data.galaxy_fqdn);
    } catch {}
  },
}));
