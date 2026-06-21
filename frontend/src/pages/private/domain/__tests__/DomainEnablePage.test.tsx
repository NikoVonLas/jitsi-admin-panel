import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import DomainEnablePage from '../DomainEnablePage';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

describe('DomainEnablePage', () => {
  it('renders without crashing', () => {
    render(<DomainEnablePage />);
  });

  it('navigates to /setting?tab=domains', () => {
    render(<DomainEnablePage />);
    expect(mockNavigate).toHaveBeenCalledWith('/setting?tab=domains', { replace: true });
  });

  it('returns null', () => {
    const { container } = render(<DomainEnablePage />);
    expect(container.firstChild).toBeNull();
  });
});
