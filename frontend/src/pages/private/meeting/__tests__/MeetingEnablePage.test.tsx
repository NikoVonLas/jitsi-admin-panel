import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import MeetingEnablePage from '../MeetingEnablePage';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

describe('MeetingEnablePage', () => {
  it('renders without crashing', () => {
    render(<MeetingEnablePage />);
  });

  it('navigates to /meeting', () => {
    render(<MeetingEnablePage />);
    expect(mockNavigate).toHaveBeenCalledWith('/meeting', { replace: true });
  });

  it('returns null', () => {
    const { container } = render(<MeetingEnablePage />);
    expect(container.firstChild).toBeNull();
  });
});
