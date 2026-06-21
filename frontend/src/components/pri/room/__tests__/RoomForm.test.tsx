import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import RoomForm from '../RoomForm';

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

describe('RoomForm (add mode)', () => {
  it('renders without crashing', () => {
    const { container } = render(<RoomForm />);
    expect(container).toBeInTheDocument();
  });

  it('renders cancel button', () => {
    render(<RoomForm />);
    expect(screen.getByText('btn.cancel')).toBeInTheDocument();
  });

  it('renders add button', () => {
    render(<RoomForm />);
    expect(screen.getByText('btn.add')).toBeInTheDocument();
  });

  it('calls onCancel when cancel button clicked', () => {
    const onCancel = vi.fn();
    render(<RoomForm onCancel={onCancel} />);
    screen.getByText('btn.cancel').closest('button')?.click();
    expect(onCancel).toHaveBeenCalled();
  });
});

describe('RoomForm (update mode)', () => {
  const initialRoom = {
    id: 'r1',
    label: 'My Room',
    slug: 'my-room',
    domainId: 'd1',
    hasSuffix: false,
  };

  it('renders with pre-filled label value', () => {
    render(<RoomForm initialRoom={initialRoom} />);
    expect(screen.getByDisplayValue('My Room')).toBeInTheDocument();
  });

  it('renders update button in update mode', () => {
    render(<RoomForm initialRoom={initialRoom} />);
    expect(screen.getByText('btn.update')).toBeInTheDocument();
  });
});
