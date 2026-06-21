import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import RoomAdd from '../RoomAdd';

vi.mock('../../../../i18n', () => ({
  useTr: () => (k: string) => k,
}));

vi.mock('../../../../lib/api', () => ({
  action: vi.fn().mockResolvedValue({ id: 'new-room' }),
  list: vi.fn().mockResolvedValue({ items: [] }),
}));

vi.mock('../RoomFields', () => ({
  default: () => <div data-testid="room-fields" />,
}));

describe('RoomAdd', () => {
  it('renders without crashing', () => {
    const { container } = render(<RoomAdd />);
    expect(container).toBeInTheDocument();
  });

  it('renders add button', () => {
    render(<RoomAdd />);
    expect(screen.getByText('btn.add')).toBeInTheDocument();
  });

  it('renders cancel button', () => {
    render(<RoomAdd />);
    expect(screen.getByText('btn.cancel')).toBeInTheDocument();
  });

  it('calls onCancel when cancel clicked', () => {
    const onCancel = vi.fn();
    render(<RoomAdd onCancel={onCancel} />);
    screen.getByText('btn.cancel').closest('button')?.click();
    expect(onCancel).toHaveBeenCalled();
  });
});
