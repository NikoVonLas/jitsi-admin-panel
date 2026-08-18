import { useEffect } from 'react';
import { get } from '../../lib/api';
import { clearAuthentication } from '../../lib/session';

export default function OidcClean() {
  useEffect(() => {
    async function load() {
      clearAuthentication();
      try {
        await get('/api/adm/identity/clear');
      } catch {}
      globalThis.location.replace('/login');
    }
    load();
  }, []);
  return null;
}
