import { useState, useEffect } from 'react';
import { Modal } from 'antd';
import { list, listFiltered } from '../../lib/api';
import { useTr } from '../../i18n';
import type { Domain333, EnabledFilter, Meeting222, Room333 } from '../../types';
import Subheader from '../../components/common/Subheader';
import AlertWarning from '../../components/common/AlertWarning';
import MeetingList from '../../components/pri/meeting/MeetingList';
import MeetingAdd from '../../components/pri/meeting/MeetingAdd';

const PAGE_SIZE = 12;

export default function MeetingPage() {
  const t = useTr();
  const [meetings, setMeetings] = useState<Meeting222[]>([]);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const [enabledFilter, setEnabledFilter] = useState<EnabledFilter>('all');
  const [roomFilter, setRoomFilter] = useState('');
  const [domainFilter, setDomainFilter] = useState('');

  const [dateFilter, setDateFilter] = useState(() => new URLSearchParams(globalThis.location.search).get('date') ?? '');
  const [rooms, setRooms] = useState<Room333[]>([]);
  const [domains, setDomains] = useState<Domain333[]>([]);
  const [addOpen, setAddOpen] = useState(false);

  useEffect(() => {
    Promise.all([
      list('/api/pri/room/list', 500).catch(() => ({ items: [] })),
      list('/api/pri/domain/list', 500).catch(() => ({ items: [] })),
    ]).then(([r, d]) => {
      setRooms(Array.isArray(r) ? r : (r.items ?? []));
      setDomains(Array.isArray(d) ? d : (d.items ?? []));
    });
  }, []);

  async function loadMeetings() {
    try {
      setError(false);
      setLoading(true);
      const result = await listFiltered<Meeting222>('/api/pri/meeting/list', {
        limit: PAGE_SIZE, offset: page * PAGE_SIZE, search,
        enabled: enabledFilter === 'all' ? null : enabledFilter === 'enabled',
        room_id: roomFilter || undefined, domain_id: domainFilter || undefined,
        identity_id: undefined, session_date: dateFilter || undefined,
      });
      setMeetings(result.items);
      setTotal(result.total);
    } catch { setError(true); }
    finally { setLoading(false); }
  }

  useEffect(() => { loadMeetings(); }, [page, search, enabledFilter, roomFilter, domainFilter, dateFilter]);

  return (
    <div>
      <Subheader title={t('page.meetings')} onAdd={() => setAddOpen(true)} addTitle={t('sub.add_meeting')} hrefCalendar="/calendar/month" hrefCalendarTitle={t('sub.calendar_view')} />
      {error && <AlertWarning type="error">{t('err.generic')}</AlertWarning>}
      <MeetingList
        meetings={meetings} total={total} page={page} loading={loading} pageSize={PAGE_SIZE}
        search={search} enabledFilter={enabledFilter} rooms={rooms} domains={domains}
        roomFilter={roomFilter} domainFilter={domainFilter} dateFilter={dateFilter}
        onRefresh={loadMeetings} onAdd={() => setAddOpen(true)}
        onPageChange={(p) => setPage(p)}
        onSearchChange={(s) => { setSearch(s); setPage(0); }}
        onEnabledChange={(f) => { setEnabledFilter(f); setPage(0); }}
        onRoomChange={(id) => { setRoomFilter(id); setPage(0); }}
        onDomainChange={(id) => { setDomainFilter(id); setPage(0); }}
        onDateChange={(d) => { setDateFilter(d); setPage(0); }}
      />
      <Modal open={addOpen} onCancel={() => setAddOpen(false)} title={t('page.add_meeting')} footer={null} width={680}>
        <MeetingAdd onCancel={() => setAddOpen(false)} onSuccess={() => { setAddOpen(false); setPage(0); loadMeetings(); }} />
      </Modal>
    </div>
  );
}
