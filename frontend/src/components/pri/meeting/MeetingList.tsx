import { Segmented } from 'antd';
import { useTr } from '../../../i18n';
import AppDatePicker from '../../common/AppDatePicker';
import type { Domain333, EnabledFilter, Meeting222, Room333 } from '../../../types';
import SelectSearch from '../../common/SelectSearch';
import PaginatedList from '../../common/PaginatedList';
import MeetingListItem from './MeetingListItem';

interface Props {
  readonly meetings: Meeting222[];
  readonly total: number;
  readonly page: number;
  readonly loading: boolean;
  readonly pageSize: number;
  readonly search: string;
  readonly enabledFilter: EnabledFilter;
  readonly rooms: Room333[];
  readonly domains: Domain333[];
  readonly roomFilter: string;
  readonly domainFilter: string;
  readonly dateFilter: string;
  readonly onRefresh?: () => void;
  readonly onAdd?: () => void;
  readonly onPageChange?: (p: number) => void;
  readonly onSearchChange?: (s: string) => void;
  readonly onEnabledChange?: (f: EnabledFilter) => void;
  readonly onRoomChange?: (id: string) => void;
  readonly onDomainChange?: (id: string) => void;
  readonly onDateChange?: (d: string) => void;
}

export default function MeetingList({
  meetings, total, page, loading, pageSize,
  search, enabledFilter, rooms, domains,
  roomFilter, domainFilter, dateFilter,
  onRefresh, onAdd, onPageChange,
  onSearchChange, onEnabledChange, onRoomChange, onDomainChange, onDateChange,
}: Props) {
  const t = useTr();
  const isFiltered = !!search || enabledFilter !== 'all' || !!roomFilter || !!domainFilter || !!dateFilter;
  const hasActiveFilters = enabledFilter !== 'all' || !!roomFilter || !!domainFilter || !!dateFilter;

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
      <AppDatePicker
        value={dateFilter || null}
        onChange={(v) => onDateChange?.(v)}
        style={{ maxWidth: 160 }}
        allowClear
      />
      {rooms.length > 1 && (
        <SelectSearch
          options={rooms.map((r) => ({ value: r.id, label: r.label || r.name }))}
          value={roomFilter}
          allLabel={t('filter.all_rooms')}
          onChange={(id) => onRoomChange?.(id)}
          style={{ maxWidth: 200 }}
        />
      )}
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
      items={meetings}
      total={total}
      page={page}
      loading={loading}
      pageSize={pageSize}
      search={search}
      isFiltered={isFiltered}
      hasActiveFilters={hasActiveFilters}
      emptyKey="empty.meetings"
      filterPanel={filterPanel}
      onAdd={onAdd}
      onPageChange={onPageChange}
      onSearchChange={onSearchChange}
      renderItem={(m) => <MeetingListItem key={m.id} meeting={m} onRefresh={onRefresh} />}
    />
  );
}
