import { useEffect } from 'react';
import { action } from '../../lib/api';
import { clearAuthentication, markAuthenticated } from '../../lib/session';

function normalizeNextPath(value: unknown): string {
  if (
    typeof value !== 'string' ||
    !value.startsWith('/') ||
    value.startsWith('//') ||
    value.includes('\\')
  ) {
    return '/';
  }
  try {
    const resolved = new URL(value, globalThis.location.origin);
    if (resolved.origin !== globalThis.location.origin) return '/';
    return `${resolved.pathname}${resolved.search}${resolved.hash}`;
  } catch {
    return '/';
  }
}

export default function OidcValidate() {
  useEffect(() => {
    async function load() {
      clearAuthentication();
      try {
        const qs = new URLSearchParams(globalThis.location.search);
        const code = qs.get('code');
        const state = qs.get('state');
        if (!code || !state) throw new Error('incomplete OIDC callback');

        const identity = await action('/api/adm/identity/get/bycode', { code, state });
        markAuthenticated('oidc');
        globalThis.location.replace(normalizeNextPath(identity.next));
      } catch {
        clearAuthentication();
        globalThis.location.replace('/login');
      }
    }
    load();
  }, []);
  return null;
}
