import { useEffect } from 'react';
import { get } from '../../lib/api';

export default function OidcClean() {
  useEffect(() => {
    async function load() {
      localStorage.clear();
      sessionStorage.clear();
      try {
        await get('/api/adm/identity/clear');
      } catch {}
      globalThis.location.replace('/api/adm/oidc/redirect?prompt=consent');
    }
    load();
  }, []);
  return null;
}
