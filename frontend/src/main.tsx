import { StrictMode, useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ConfigProvider, App as AntApp } from 'antd';
import { StyleProvider } from 'antd-style';
import ru_RU from 'antd/locale/ru_RU';
import en_US from 'antd/locale/en_US';
import dayjs from 'dayjs';
import 'dayjs/locale/ru';
import 'dayjs/locale/en';
import { shadcnTheme, shadcnDarkTheme } from './theme/shadcnTheme';
import { usePrefStore } from './store/pref';
import App from './App';
import '@fontsource-variable/inter';
import 'bootstrap-icons/font/bootstrap-icons.min.css';
import './app.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
});

const darkMq = globalThis.matchMedia('(prefers-color-scheme: dark)');

function Root() {
  const [systemDark, setSystemDark] = useState(darkMq.matches);
  const theme = usePrefStore((s) => s.theme);

  const lang = usePrefStore((s) => s.lang);
  const antdLocale = lang === 'ru' ? ru_RU : en_US;

  useEffect(() => {
    dayjs.locale(lang === 'ru' ? 'ru' : 'en');
  }, [lang]);

  let isDark: boolean;
  if (theme === 'dark') {
    isDark = true;
  } else if (theme === 'light') {
    isDark = false;
  } else {
    isDark = systemDark;
  }

  // Apply data-theme immediately on every render (synchronous, before paint)
  document.documentElement.dataset.theme = isDark ? 'dark' : 'light';

  useEffect(() => {
    const handler = (e: MediaQueryListEvent) => setSystemDark(e.matches);
    darkMq.addEventListener('change', handler);
    return () => darkMq.removeEventListener('change', handler);
  }, []);

  const currentTheme = isDark ? shadcnDarkTheme : shadcnTheme;

  return (
    <ConfigProvider theme={currentTheme} locale={antdLocale}>
      <StyleProvider>
        <AntApp>
          <App />
        </AntApp>
      </StyleProvider>
    </ConfigProvider>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <Root />
    </QueryClientProvider>
  </StrictMode>
);
