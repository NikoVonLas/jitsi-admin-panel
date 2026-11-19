import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import RoomForm from '../RoomForm';
import { action } from '../../../../lib/api';
import { ApiError } from '../../../../lib/apiError';

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

describe('RoomForm (refused request)', () => {
  const initialRoom = {
    id: 'r1',
    label: 'My Room',
    slug: 'my-room',
    domainId: 'd1',
    hasSuffix: false,
  };

  function submit(label: string) {
    const button = screen.getByText(label).closest('button');
    if (button) fireEvent.click(button);
  }

  it('says the slug is taken when another room of the domain uses it', async () => {
    vi.mocked(action).mockRejectedValueOnce(new ApiError(409, 'room_name_taken'));
    render(<RoomForm />);
    submit('btn.add');
    expect(await screen.findByText('err.room_name_taken')).toBeInTheDocument();
  });

  it('says the slug is taken when a rename hits another room', async () => {
    vi.mocked(action).mockRejectedValueOnce(new ApiError(409, 'room_name_taken'));
    render(<RoomForm initialRoom={initialRoom} />);
    submit('btn.update');
    expect(await screen.findByText('err.room_name_taken')).toBeInTheDocument();
  });

  it('keeps the general message for any other failure', async () => {
    vi.mocked(action).mockRejectedValueOnce(new ApiError(500));
    render(<RoomForm />);
    submit('btn.add');
    expect(await screen.findByText('err.add')).toBeInTheDocument();
    expect(screen.queryByText('err.room_name_taken')).not.toBeInTheDocument();
  });
});
