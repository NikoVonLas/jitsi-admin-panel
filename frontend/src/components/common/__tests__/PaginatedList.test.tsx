import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import PaginatedList from '../PaginatedList';

vi.mock('../../../i18n', () => ({
  useTr: () => (k: string) => k,
  useI18n: () => ({ lang: 'en', setLang: () => {}, t: (k: string) => k }),
}));

vi.mock('../../../hooks/useIsMobile', () => ({
  useIsMobile: () => false,
}));

const defaultProps = {
  items: [] as { id: string }[],
  total: 0,
  page: 0,
  loading: false,
  pageSize: 10,
  search: '',
  isFiltered: false,
  hasActiveFilters: false,
  emptyKey: 'empty.items',
  filterPanel: <div data-testid="filter-panel" />,
  renderItem: (item: { id: string }) => <div key={item.id}>{item.id}</div>,
};

describe('PaginatedList', () => {
  it('renders search input', () => {
    render(<PaginatedList {...defaultProps} />);
    expect(document.querySelector('input')).toBeInTheDocument();
  });

  it('renders empty state when no items', () => {
    render(<PaginatedList {...defaultProps} />);
    expect(screen.getByText('empty.items')).toBeInTheDocument();
  });

  it('renders empty.no_results when filtered and empty', () => {
    render(<PaginatedList {...defaultProps} isFiltered total={0} />);
    expect(screen.getByText('empty.no_results')).toBeInTheDocument();
  });

  it('renders list items', () => {
    const items = [{ id: 'a1' }, { id: 'b2' }];
    render(
      <PaginatedList
        {...defaultProps}
        items={items}
        total={2}
        renderItem={(item) => <div key={item.id} data-testid="item">{item.id}</div>}
      />,
    );
    expect(screen.getAllByTestId('item')).toHaveLength(2);
  });

  it('does not render pagination when total <= pageSize', () => {
    render(
      <PaginatedList {...defaultProps} items={[{ id: '1' }]} total={5} pageSize={10} />,
    );
    expect(document.querySelector('.ant-pagination')).toBeNull();
  });

  it('renders pagination when total > pageSize', () => {
    const items = Array.from({ length: 10 }, (_, i) => ({ id: String(i) }));
    render(
      <PaginatedList
        {...defaultProps}
        items={items}
        total={25}
        pageSize={10}
        renderItem={(item) => <div key={item.id}>{item.id}</div>}
      />,
    );
    expect(document.querySelector('.ant-pagination')).toBeInTheDocument();
  });

  it('applies opacity when loading', () => {
    const { container } = render(
      <PaginatedList {...defaultProps} loading />,
    );
    const grid = container.querySelector('.card-grid');
    expect(grid).toHaveStyle({ opacity: '0.4' });
  });

  it('calls onAdd when add button in empty state is clicked', () => {
    const onAdd = vi.fn();
    render(<PaginatedList {...defaultProps} onAdd={onAdd} />);
    fireEvent.click(screen.getByText('btn.add'));
    expect(onAdd).toHaveBeenCalled();
  });

  it('renders filter panel on desktop', () => {
    render(<PaginatedList {...defaultProps} />);
    expect(screen.getByTestId('filter-panel')).toBeInTheDocument();
  });
});
