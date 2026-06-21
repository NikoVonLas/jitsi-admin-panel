import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import MeetingDisablePage from '../MeetingDisablePage';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

describe('MeetingDisablePage', () => {
  it('renders without crashing', () => {
    render(<MeetingDisablePage />);
  });

  it('navigates to /meeting', () => {
    render(<MeetingDisablePage />);
    expect(mockNavigate).toHaveBeenCalledWith('/meeting', { replace: true });
  });

  it('returns null', () => {
    const { container } = render(<MeetingDisablePage />);
    expect(container.firstChild).toBeNull();
  });
});
