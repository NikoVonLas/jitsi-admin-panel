import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import CalendarPage from '../CalendarPage';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

vi.mock('../../lib/common', () => ({
  getToday: () => '2026-06-21',
}));

describe('CalendarPage', () => {
  it('renders without crashing', () => {
    render(<CalendarPage />);
  });

  it('navigates to calendar month view with today', () => {
    render(<CalendarPage />);
    expect(mockNavigate).toHaveBeenCalledWith('/calendar/month/2026-06-21', { replace: true });
  });

  it('returns null', () => {
    const { container } = render(<CalendarPage />);
    expect(container.firstChild).toBeNull();
  });
});
