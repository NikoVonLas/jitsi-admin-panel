import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import DomainDelPage from '../DomainDelPage';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  useParams: () => ({ uuid: 'test-uuid' }),
}));

describe('DomainDelPage', () => {
  it('renders without crashing', () => {
    render(<DomainDelPage />);
  });

  it('navigates to /setting?tab=domains', () => {
    render(<DomainDelPage />);
    expect(mockNavigate).toHaveBeenCalledWith('/setting?tab=domains', { replace: true });
  });

  it('returns null', () => {
    const { container } = render(<DomainDelPage />);
    expect(container.firstChild).toBeNull();
  });
});
