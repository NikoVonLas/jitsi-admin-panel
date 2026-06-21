import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import RoomUpdate from '../RoomUpdate';
import type { Room } from '../../../../types';

vi.mock('../../../../i18n', () => ({
  useTr: () => (k: string) => k,
}));

vi.mock('../../../../lib/api', () => ({
  action: vi.fn().mockResolvedValue({ id: 'r1' }),
  list: vi.fn().mockResolvedValue({ items: [] }),
}));

vi.mock('../RoomFields', () => ({
  default: ({ label, slug }: { label: string; slug: string }) => (
    <div>
      <input aria-label="form.label" defaultValue={label} />
      <input aria-label="form.slug" defaultValue={slug} />
    </div>
  ),
}));

const baseRoom: Room = {
  id: 'room-1',
  name: 'my-room',
  label: 'My Room',
  domain_id: 'domain-1',
  domain_name: 'Test Domain',
  domain_url: 'https://meet.example.com',
  domain_enabled: true,
  has_suffix: false,
  enabled: true,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  accessed_at: '2024-01-01T00:00:00Z',
};

describe('RoomUpdate', () => {
  it('renders without crashing', () => {
    const { container } = render(<RoomUpdate room={baseRoom} />);
    expect(container).toBeInTheDocument();
  });

  it('passes room label to RoomForm', () => {
    render(<RoomUpdate room={baseRoom} />);
    expect(screen.getByDisplayValue('My Room')).toBeInTheDocument();
  });

  it('passes room slug to RoomForm', () => {
    render(<RoomUpdate room={baseRoom} />);
    expect(screen.getByDisplayValue('my-room')).toBeInTheDocument();
  });

  it('renders update button', () => {
    render(<RoomUpdate room={baseRoom} />);
    expect(screen.getByText('btn.update')).toBeInTheDocument();
  });

  it('calls onCancel when cancel button clicked', () => {
    const onCancel = vi.fn();
    render(<RoomUpdate room={baseRoom} onCancel={onCancel} />);
    screen.getByText('btn.cancel').closest('button')?.click();
    expect(onCancel).toHaveBeenCalled();
  });

  it('renders with has_suffix room', () => {
    const suffixRoom = { ...baseRoom, has_suffix: true };
    const { container } = render(<RoomUpdate room={suffixRoom} />);
    expect(container).toBeInTheDocument();
  });
});
