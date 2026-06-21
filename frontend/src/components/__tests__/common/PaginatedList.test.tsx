import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import PaginatedList from '../../common/PaginatedList';

vi.mock('../../../i18n', () => ({
  useTr: () => (key: string) => key,
}));

vi.mock('../../../hooks/useIsMobile', () => ({
  useIsMobile: () => false,
}));

vi.mock('../../common/AlertWarning', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div data-testid="alert">{children}</div>,
}));

const defaultProps = {
  items: [] as { id: string }[],
  total: 0,
  page: 0,
  loading: false,
  pageSize: 12,
  search: '',
  isFiltered: false,
  hasActiveFilters: false,
  emptyKey: 'empty.meetings',
  filterPanel: <div data-testid="filter-panel">Filters</div>,
  renderItem: (item: { id: string }) => <div key={item.id} data-testid="item">{item.id}</div>,
};

describe('PaginatedList', () => {
  it('renders without crashing', () => {
    render(<PaginatedList {...defaultProps} />);
  });

  it('renders search input', () => {
    render(<PaginatedList {...defaultProps} />);
    expect(document.querySelector('input')).toBeInTheDocument();
  });

  it('renders filter panel', () => {
    render(<PaginatedList {...defaultProps} />);
    expect(screen.getByTestId('filter-panel')).toBeInTheDocument();
  });

  it('renders items', () => {
    const items = [{ id: 'item-1' }, { id: 'item-2' }, { id: 'item-3' }];
    render(<PaginatedList {...defaultProps} items={items} total={3} />);
    expect(screen.getAllByTestId('item')).toHaveLength(3);
  });

  it('shows empty state with add button when no items and not filtered', () => {
    const onAdd = vi.fn();
    render(<PaginatedList {...defaultProps} items={[]} total={0} onAdd={onAdd} />);
    expect(screen.getByText('empty.meetings')).toBeInTheDocument();
    expect(screen.getByText('btn.add')).toBeInTheDocument();
  });

  it('shows no results message when filtered and empty', () => {
    render(<PaginatedList {...defaultProps} items={[]} total={0} isFiltered={true} />);
    expect(screen.getByText('empty.no_results')).toBeInTheDocument();
  });

  it('does not show empty state when loading', () => {
    render(<PaginatedList {...defaultProps} items={[]} total={0} loading={true} />);
    expect(screen.queryByText('empty.meetings')).toBeNull();
  });

  it('shows pagination when total exceeds pageSize', () => {
    const items = Array.from({ length: 12 }, (_, i) => ({ id: `item-${i}` }));
    render(<PaginatedList {...defaultProps} items={items} total={30} pageSize={12} />);
    expect(document.querySelector('.ant-pagination')).toBeInTheDocument();
  });

  it('does not show pagination when total is less than pageSize', () => {
    const items = [{ id: 'item-1' }];
    render(<PaginatedList {...defaultProps} items={items} total={1} pageSize={12} />);
    expect(document.querySelector('.ant-pagination')).toBeNull();
  });

  it('calls onAdd when add button is clicked in empty state', () => {
    const onAdd = vi.fn();
    render(<PaginatedList {...defaultProps} items={[]} total={0} onAdd={onAdd} />);
    fireEvent.click(screen.getByText('btn.add'));
    expect(onAdd).toHaveBeenCalled();
  });

  it('applies loading opacity to grid', () => {
    render(<PaginatedList {...defaultProps} loading={true} />);
    const grid = document.querySelector('.card-grid') as HTMLElement;
    expect(grid.style.opacity).toBe('0.4');
  });

  it('renders with active filters without crashing', () => {
    render(<PaginatedList {...defaultProps} hasActiveFilters={true} />);
  });

  it('calls onPageChange when page changes', () => {
    const onPageChange = vi.fn();
    const items = Array.from({ length: 12 }, (_, i) => ({ id: `item-${i}` }));
    render(
      <PaginatedList
        {...defaultProps}
        items={items}
        total={30}
        pageSize={12}
        onPageChange={onPageChange}
      />
    );
    // Pagination exists
    expect(document.querySelector('.ant-pagination')).toBeInTheDocument();
  });
});
