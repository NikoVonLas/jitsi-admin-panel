import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import DomainPage from '../DomainPage';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

describe('DomainPage', () => {
  it('renders without crashing', () => {
    render(<DomainPage />);
  });

  it('navigates to /setting?tab=domains', () => {
    render(<DomainPage />);
    expect(mockNavigate).toHaveBeenCalledWith('/setting?tab=domains', { replace: true });
  });

  it('returns null', () => {
    const { container } = render(<DomainPage />);
    expect(container.firstChild).toBeNull();
  });
});
