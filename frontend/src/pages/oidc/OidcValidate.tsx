import { useEffect } from 'react';
import { get, action } from '../../lib/api';

// Decode state param: supports new JSON-in-base64 format AND legacy plain path
function decodeState(qs: URLSearchParams): { next: string; pid?: string } {
  const state = qs.get('state');
  if (!state) return { next: '/' };

  // New format: encodeURIComponent(btoa(JSON.stringify({next, pid})))
  try {
    const decoded = decodeURIComponent(state);
    const json = JSON.parse(atob(decoded));
    if (json && typeof json === 'object') {
      const next =
        typeof json.next === 'string' && json.next.startsWith('/') ? json.next : '/';
      const pid = typeof json.pid === 'string' ? json.pid : undefined;
      return { next, pid };
    }
  } catch {
    // fall through to legacy
  }

  // Legacy format: encodeURIComponent("/some/path")
  try {
    const decoded = decodeURIComponent(state);
    if (decoded.startsWith('/')) return { next: decoded };
  } catch {
    // ignore
  }

  return { next: '/' };
}

export default function OidcValidate() {
  useEffect(() => {
    async function load() {
      const saved: Record<string, string | null> = {
        theme: localStorage.getItem('theme'),
        lang: localStorage.getItem('lang'),
        week_start: localStorage.getItem('week_start'),
      };
      localStorage.clear();
      sessionStorage.clear();
      for (const [k, v] of Object.entries(saved)) {
        if (v) localStorage.setItem(k, v);
      }
      sessionStorage.setItem('oidc_authenticated', 'ok');
      try {
        await get('/api/adm/identity/clear');
        const qs = new URLSearchParams(globalThis.location.search);
        const { next, pid } = decodeState(qs);
        const code = qs.get('code');
        if (!code) throw new Error('code not found');

        // Pass provider_id so the backend uses the correct OIDC credentials
        await action('/api/adm/identity/get/bycode', {
          code,
          ...(pid ? { provider_id: pid } : {}),
        });

        // Mark as authenticated in localStorage (analogous to local auth)
        localStorage.setItem('auth_token', 'oidc');
        globalThis.location.replace(next);
      } catch {
        globalThis.location.replace('/login');
      }
    }
    load();
  }, []);
  return null;
}
