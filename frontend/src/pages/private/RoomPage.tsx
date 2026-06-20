import { useState, useEffect } from 'react';
import { Modal } from 'antd';
import { list, listFiltered } from '../../lib/api';
import { useTr } from '../../i18n';
import type { Domain333, EnabledFilter, Room333 } from '../../types';
import Subheader from '../../components/common/Subheader';
import AlertWarning from '../../components/common/AlertWarning';
import RoomList from '../../components/pri/room/RoomList';
import RoomAdd from '../../components/pri/room/RoomAdd';

const PAGE_SIZE = 12;

export default function RoomPage() {
  const t = useTr();
  const [rooms, setRooms] = useState<Room333[]>([]);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const [enabledFilter, setEnabledFilter] = useState<EnabledFilter>('all');
  const [domainFilter, setDomainFilter] = useState('');

  const [domains, setDomains] = useState<Domain333[]>([]);
  const [addOpen, setAddOpen] = useState(false);

  useEffect(() => {
    list('/api/pri/domain/list', 500)
      .then((res) => setDomains(Array.isArray(res) ? res : (res.items ?? [])))
      .catch(() => {});
  }, []);

  async function loadRooms() {
    try {
      setError(false);
      setLoading(true);
      const result = await listFiltered<Room333>('/api/pri/room/list', {
        limit: PAGE_SIZE,
        offset: page * PAGE_SIZE,
        search,
        enabled: enabledFilter === 'all' ? null : enabledFilter === 'enabled',
        domain_id: domainFilter || undefined,
        identity_id: undefined,
      });
      setRooms(result.items);
      setTotal(result.total);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadRooms(); }, [page, search, enabledFilter, domainFilter]);

  return (
    <div>
      <Subheader title={t('page.rooms')} onAdd={() => setAddOpen(true)} addTitle={t('page.add_room')} />
      {error && <AlertWarning type="error">{t('err.generic')}</AlertWarning>}
      <RoomList
        rooms={rooms} total={total} page={page} loading={loading} pageSize={PAGE_SIZE}
        search={search} enabledFilter={enabledFilter} domains={domains}
        domainFilter={domainFilter}
        onRefresh={loadRooms} onAdd={() => setAddOpen(true)}
        onPageChange={(p) => setPage(p)}
        onSearchChange={(s) => { setSearch(s); setPage(0); }}
        onEnabledChange={(f) => { setEnabledFilter(f); setPage(0); }}
        onDomainChange={(id) => { setDomainFilter(id); setPage(0); }}
      />
      <Modal open={addOpen} onCancel={() => setAddOpen(false)} title={t('page.add_room')} footer={null} width={600}>
        <RoomAdd onCancel={() => setAddOpen(false)} onDone={() => { setAddOpen(false); setPage(0); loadRooms(); }} />
      </Modal>
    </div>
  );
}
