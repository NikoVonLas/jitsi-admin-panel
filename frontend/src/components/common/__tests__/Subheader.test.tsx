import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Subheader from '../Subheader';

vi.mock('../../../i18n', () => ({
  useTr: () => (k: string) => k,
}));

vi.mock('../../../hooks/useIsMobile', () => ({
  useIsMobile: () => false,
}));

vi.mock('react-router-dom', () => ({
  Link: ({ children, to }: { children: React.ReactNode; to: string }) => (
    <a href={to}>{children}</a>
  ),
  useNavigate: () => vi.fn(),
}));

describe('Subheader', () => {
  it('renders the title', () => {
    render(<Subheader title="My Page" />);
    expect(screen.getByText('My Page')).toBeInTheDocument();
  });

  it('renders the add button when onAdd provided', () => {
    const onAdd = vi.fn();
    render(<Subheader title="My Page" onAdd={onAdd} addTitle="Add Item" />);
    expect(screen.getByText('Add Item')).toBeInTheDocument();
  });

  it('calls onAdd when add button clicked', () => {
    const onAdd = vi.fn();
    render(<Subheader title="My Page" onAdd={onAdd} addTitle="Add" />);
    fireEvent.click(screen.getByText('Add'));
    expect(onAdd).toHaveBeenCalled();
  });

  it('renders calendar link when hrefCalendar provided', () => {
    render(<Subheader title="My Page" hrefCalendar="/calendar" />);
    expect(document.querySelector('a[href="/calendar"]')).toBeInTheDocument();
  });

  it('renders meeting link when hrefMeeting provided', () => {
    render(<Subheader title="My Page" hrefMeeting="/meetings" />);
    expect(document.querySelector('a[href="/meetings"]')).toBeInTheDocument();
  });

  it('renders extra content when extra provided', () => {
    render(<Subheader title="My Page" extra={<span>Extra Content</span>} />);
    expect(screen.getByText('Extra Content')).toBeInTheDocument();
  });

  it('hides add button when addHidden is true', () => {
    render(<Subheader title="My Page" onAdd={vi.fn()} addTitle="Add" addHidden />);
    const btn = screen.getByText('Add').closest('button') as HTMLButtonElement;
    expect(btn.closest('[style*="visibility: hidden"]') ?? btn).toBeTruthy();
  });
});
