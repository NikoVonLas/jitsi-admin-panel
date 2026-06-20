import { Segmented } from 'antd';
import { useTr } from '../../../i18n';
import type { Domain333, EnabledFilter, Room333 } from '../../../types';
import SelectSearch from '../../common/SelectSearch';
import PaginatedList from '../../common/PaginatedList';
import RoomListItem from './RoomListItem';

interface Props {
  readonly rooms: Room333[];
  readonly total: number;
  readonly page: number;
  readonly loading: boolean;
  readonly pageSize: number;
  readonly search: string;
  readonly enabledFilter: EnabledFilter;
  readonly domains: Domain333[];
  readonly domainFilter: string;
  readonly onRefresh?: () => void;
  readonly onAdd?: () => void;
  readonly onPageChange?: (p: number) => void;
  readonly onSearchChange?: (s: string) => void;
  readonly onEnabledChange?: (f: EnabledFilter) => void;
  readonly onDomainChange?: (id: string) => void;
}

export default function RoomList({
  rooms, total, page, loading, pageSize, search, enabledFilter,
  domains, domainFilter, onRefresh, onAdd,
  onPageChange, onSearchChange, onEnabledChange, onDomainChange,
}: Props) {
  const t = useTr();
  const isFiltered = !!search || enabledFilter !== 'all' || !!domainFilter;
  const hasActiveFilters = enabledFilter !== 'all' || !!domainFilter;

  const filterPanel = (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
      <Segmented
        options={[
          { value: 'all', label: t('filter.all') },
          { value: 'enabled', label: t('filter.enabled') },
          { value: 'disabled', label: t('filter.disabled') },
        ]}
        value={enabledFilter}
        onChange={(v) => onEnabledChange?.(v as 'all' | 'enabled' | 'disabled')}
      />
      {domains.length > 1 && (
        <SelectSearch
          options={domains.map((d) => ({ value: d.id, label: d.name }))}
          value={domainFilter}
          allLabel={t('filter.all_domains')}
          onChange={(id) => onDomainChange?.(id)}
          style={{ maxWidth: 200 }}
        />
      )}
    </div>
  );

  return (
    <PaginatedList
      items={rooms}
      total={total}
      page={page}
      loading={loading}
      pageSize={pageSize}
      search={search}
      isFiltered={isFiltered}
      hasActiveFilters={hasActiveFilters}
      emptyKey="empty.rooms"
      filterPanel={filterPanel}
      onAdd={onAdd}
      onPageChange={onPageChange}
      onSearchChange={onSearchChange}
      renderItem={(r) => <RoomListItem key={r.id} room={r} onRefresh={onRefresh} />}
    />
  );
}
