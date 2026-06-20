import { useEffect, useState } from 'react';
import { action } from '../../lib/api';
import { httpPost } from '../../lib/http';
import { t } from '../../i18n';

function normalizeDomain(val: string | null): string {
  if (!val) return '';
  let s = val.trim();
  while (s.endsWith('/')) s = s.slice(0, -1);
  return s;
}

function normalizeNext(val: string): string {
  if (!val.startsWith('/')) return '/pri';
  return val;
}

export default function JitsiTokenAuthPage() {
  const [message, setMessage] = useState(() => t('jitsi.checking'));
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      const qs = new URLSearchParams(globalThis.location.search);
      const room = qs.get('room');
      const domain = normalizeDomain(qs.get('domain'));
      const next = normalizeNext(`${globalThis.location.pathname}${globalThis.location.search}`);

      if (!room) {
        setMessage('');
        setError(t('jitsi.err_no_room'));
        return;
      }

      try {
        const res = await httpPost('/api/pri/hello', '{}');
        if (res.status !== 200) throw new Error('not authenticated');
      } catch {
        setMessage(t('jitsi.redirecting_sso'));
        const encoded = encodeURIComponent(next);
        globalThis.location.href = `/api/adm/oidc/redirect?prompt=consent&next=${encoded}`;
        return;
      }

      try {
        setMessage(t('jitsi.issuing_token'));
        const link = await action('/api/pri/room/get/link/byname', {
          room_name: room,
          domain_url: domain,
        });
        if (!link.url) throw new Error('link not found');
        setMessage(t('jitsi.redirecting_jitsi'));
        globalThis.location.replace(link.url);
      } catch {
        setMessage('');
        setError(t('jitsi.err_no_resource'));
      }
    }
    load();
  }, []);

  return (
    <main style={{ padding: '40px 20px' }}>
      {message && <p>{message}</p>}
      {error && <p style={{ color: '#dc2626' }}>{error}</p>}
    </main>
  );
}
