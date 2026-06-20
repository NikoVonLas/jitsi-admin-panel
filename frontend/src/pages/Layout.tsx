import { useState, useCallback, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useAppConfig } from '../store/appconfig';
import NavBarPri from '../components/nav/NavBarPri';
import NavBarPub from '../components/nav/NavBarPub';
import MessageList from '../components/pri/message/MessageList';
import { useIntercomMessages } from '../hooks/useIntercom';
import { ping } from '../lib/nav';
import type { IntercomMessage222 } from '../types';

const NO_NAV_PREFIXES = ['/r/', '/rm/', '/jm/', '/oidc/'];
const NO_NAV_EXACT = new Set(['/', '/login']);

function shouldShowNav(pathname: string): boolean {
  if (NO_NAV_EXACT.has(pathname)) return false;
  for (const prefix of NO_NAV_PREFIXES) {
    if (pathname.startsWith(prefix)) return false;
  }
  return true;
}

export default function Layout() {
  const location = useLocation();
  const { load } = useAppConfig();
  const isAuthenticated = !!sessionStorage.getItem('oidc_authenticated');
  const showNav = shouldShowNav(location.pathname);

  const [messages, setMessages] = useState<IntercomMessage222[]>([]);
  const [isDesktop, setIsDesktop] = useState(() =>
    typeof globalThis !== 'undefined' && globalThis.matchMedia('(min-width: 992px)').matches
  );

  useEffect(() => {
    const mq = globalThis.matchMedia('(min-width: 992px)');
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const handleMessagesChange = useCallback((msgs: IntercomMessage222[]) => {
    setMessages(msgs);
  }, []);

  useIntercomMessages(isAuthenticated, handleMessagesChange);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (isAuthenticated) {
      ping();
    }
  }, [isAuthenticated]);

  return (
    <div className="app-layout">
      {showNav && (isAuthenticated ? <NavBarPri /> : <NavBarPub />)}

      <div
        className="container"
        style={{
          maxWidth: 1320,
          margin: '0 auto',
          padding: '0 16px',
          paddingTop: showNav && isDesktop ? 72 : 0,
          paddingBottom: isAuthenticated ? 80 : 16,
          minHeight: 0,
        }}
      >
        <Outlet />
      </div>

      {isAuthenticated && <MessageList messages={messages} />}
    </div>
  );
}
