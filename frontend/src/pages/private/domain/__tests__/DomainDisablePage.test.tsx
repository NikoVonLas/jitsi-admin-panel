import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import DomainDisablePage from '../DomainDisablePage';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

describe('DomainDisablePage', () => {
  it('renders without crashing', () => {
    render(<DomainDisablePage />);
  });

  it('navigates to /setting?tab=domains', () => {
    render(<DomainDisablePage />);
    expect(mockNavigate).toHaveBeenCalledWith('/setting?tab=domains', { replace: true });
  });

  it('returns null', () => {
    const { container } = render(<DomainDisablePage />);
    expect(container.firstChild).toBeNull();
  });
});
