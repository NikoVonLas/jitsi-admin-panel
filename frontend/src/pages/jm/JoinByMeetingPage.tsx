import { useParams } from 'react-router-dom';
import { httpPost } from '../../lib/http';
import { getById } from '../../lib/api';
import ModJoin from '../../components/pub/ModJoin';
import Spinner from '../../components/common/Spinner';
import { useModJoinPage, JoinPageError } from '../../hooks/useModJoinPage';

export default function JoinByMeetingPage() {
  const { uuid = '' } = useParams();

  const page = useModJoinPage({
    uuid,
    participantPathPrefix: '/j/',
    fetchInfo: async (id) => {
      const res = await httpPost('/api/pub/meeting/get/formod', { id });
      if (!res.ok) throw new Error('not ok');
      const rows = await res.json();
      if (!rows[0]) throw new Error('no result');
      return { name: rows[0].name || '', short_code: rows[0].short_code || '' };
    },
    fetchModeratorLink: async (id) => {
      const link = await getById('/api/pri/meeting/get/link', id);
      return link.moderator_url || undefined;
    },
    submitJoin: async (id, hostKey) => {
      const res = await httpPost('/api/pub/meeting/schedule/join/asmod', {
        meeting_id: id,
        host_key: hostKey,
      });
      if (res.status !== 200) throw new JoinPageError('invalid');
      const rows = await res.json();
      const row = rows[0];
      if (!row) throw new JoinPageError('invalid');
      if (row.error === 'too_early') throw new JoinPageError('too_early');
      if (row.url) return { url: row.url as string };
      throw new JoinPageError('invalid');
    },
  });

  if (!page.ready) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <Spinner />
      </div>
    );
  }

  return (
    <ModJoin
      name={page.name}
      error={page.error}
      joining={page.joining}
      participantUrl={page.participantUrl}
      qrDataUrl={page.qrDataUrl}
      canShare={page.canShare}
      copiedUrl={page.copiedUrl}
      onSubmit={page.onSubmit}
      onCopyUrl={page.onCopyUrl}
      onShareUrl={page.onShareUrl}
    />
  );
}
