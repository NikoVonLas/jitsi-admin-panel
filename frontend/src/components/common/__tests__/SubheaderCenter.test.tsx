import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import SubheaderCenter from '../SubheaderCenter';

const mockNavigate = vi.fn();

vi.mock('../../../i18n', () => ({
  useTr: () => (k: string) => k,
}));

vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

describe('SubheaderCenter', () => {
  it('renders the title', () => {
    render(<SubheaderCenter title="Page Title" />);
    expect(screen.getByText('Page Title')).toBeInTheDocument();
  });

  it('does not render back button when backUrl not provided', () => {
    render(<SubheaderCenter title="Page Title" />);
    expect(document.querySelector('button')).toBeNull();
  });

  it('renders back button when backUrl is provided', () => {
    render(<SubheaderCenter title="Page Title" backUrl="/back" />);
    expect(document.querySelector('button')).toBeInTheDocument();
  });

  it('calls navigate with backUrl when back button clicked', () => {
    render(<SubheaderCenter title="Page Title" backUrl="/previous" />);
    fireEvent.click(document.querySelector('button')!);
    expect(mockNavigate).toHaveBeenCalledWith('/previous');
  });
});
