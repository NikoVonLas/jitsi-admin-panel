import { useEffect } from 'react';

export default function OidcLogout() {
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/adm/oidc/logout-url', {
          method: 'POST', credentials: 'include',
          headers: { Accept: 'application/json' },
          body: '{}',
        });
        if (res.status === 200) {
          const rows = await res.json();
          const logoutUrl = rows[0]?.logout_url;
          if (logoutUrl) { globalThis.location.replace(logoutUrl); return; }
        }
      } catch {}
      globalThis.location.replace('/oidc/clean');
    }
    load();
  }, []);
  return null;
}
