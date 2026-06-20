import { useState } from 'react';
import { Button, Input, Pagination } from 'antd';
import { useTr } from '../../i18n';
import { useIsMobile } from '../../hooks/useIsMobile';
import AlertWarning from './AlertWarning';

interface Props<T> {
  readonly items: T[];
  readonly total: number;
  readonly page: number;
  readonly loading: boolean;
  readonly pageSize: number;
  readonly search: string;
  readonly isFiltered: boolean;
  readonly hasActiveFilters: boolean;
  readonly emptyKey: string;
  readonly filterPanel: React.ReactNode;
  readonly onAdd?: () => void;
  readonly onPageChange?: (p: number) => void;
  readonly onSearchChange?: (s: string) => void;
  readonly renderItem: (item: T) => React.ReactNode;
}

export default function PaginatedList<T extends { id: string }>({
  items, total, page, loading, pageSize,
  search, isFiltered, hasActiveFilters, emptyKey,
  filterPanel, onAdd, onPageChange, onSearchChange, renderItem,
}: Props<T>) {
  const t = useTr();
  const isMobile = useIsMobile();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const isEmpty = total === 0;

  let searchTimer: ReturnType<typeof setTimeout>;
  function handleSearchInput(e: React.ChangeEvent<HTMLInputElement>) {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => onSearchChange?.(e.target.value), 300);
  }

  return (
    <div>
      {/* Toolbar */}
      <div style={{ margin: '8px 0 16px' }}>
        {isMobile ? (
          <>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <Input.Search
                placeholder={t('search.placeholder')}
                defaultValue={search}
                onChange={handleSearchInput}
                allowClear
                style={{ flex: 1 }}
              />
              <Button
                icon={<i className="bi bi-sliders" />}
                onClick={() => setFiltersOpen((v) => !v)}
                type={hasActiveFilters ? 'primary' : 'default'}
              />
            </div>
            {filtersOpen && <div style={{ marginTop: 8 }}>{filterPanel}</div>}
          </>
        ) : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
            <Input.Search
              placeholder={t('search.placeholder')}
              defaultValue={search}
              onChange={handleSearchInput}
              style={{ maxWidth: 220 }}
              allowClear
            />
            {filterPanel}
          </div>
        )}
      </div>

      {/* Grid */}
      <div className="card-grid" style={{ opacity: loading ? 0.4 : 1, pointerEvents: loading ? 'none' : 'auto' }}>
        {items.map((item) => renderItem(item))}
      </div>

      {/* Empty state */}
      {!loading && isEmpty && (
        isFiltered
          ? <AlertWarning>{t('empty.no_results')}</AlertWarning>
          : <AlertWarning>
              {t(emptyKey)}{' '}
              <Button type="link" onClick={onAdd}>{t('btn.add')}</Button>
            </AlertWarning>
      )}

      {/* Pagination */}
      {total > pageSize && (
        <div style={{ marginTop: 24, display: 'flex', justifyContent: 'center' }}>
          <Pagination
            current={page + 1}
            total={total}
            pageSize={pageSize}
            onChange={(p) => onPageChange?.(p - 1)}
            showSizeChanger={false}
          />
        </div>
      )}
    </div>
  );
}
