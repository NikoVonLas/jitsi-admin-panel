import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import MeetingDelPage from '../MeetingDelPage';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

describe('MeetingDelPage', () => {
  it('renders without crashing', () => {
    render(<MeetingDelPage />);
  });

  it('navigates to /meeting', () => {
    render(<MeetingDelPage />);
    expect(mockNavigate).toHaveBeenCalledWith('/meeting', { replace: true });
  });

  it('returns null', () => {
    const { container } = render(<MeetingDelPage />);
    expect(container.firstChild).toBeNull();
  });
});
