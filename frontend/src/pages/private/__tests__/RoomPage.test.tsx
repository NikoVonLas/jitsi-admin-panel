import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import RoomPage from '../RoomPage';

vi.mock('../../../i18n', () => ({
  useTr: () => (key: string) => key,
}));

vi.mock('../../../lib/api', () => ({
  list: vi.fn().mockResolvedValue({ items: [], total: 0 }),
  listFiltered: vi.fn().mockResolvedValue({ items: [], total: 0 }),
}));

vi.mock('../../../components/common/Subheader', () => ({
  default: ({ title }: { title: string }) => <div data-testid="subheader">{title}</div>,
}));

vi.mock('../../../components/common/AlertWarning', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div data-testid="alert">{children}</div>,
}));

vi.mock('../../../components/pri/room/RoomList', () => ({
  default: () => <div data-testid="room-list">RoomList</div>,
}));

vi.mock('../../../components/pri/room/RoomAdd', () => ({
  default: () => <div data-testid="room-add">RoomAdd</div>,
}));

import { listFiltered } from '../../../lib/api';

describe('RoomPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(listFiltered).mockResolvedValue({ items: [], total: 0 });
  });

  it('renders without crashing', async () => {
    render(<RoomPage />);
    await waitFor(() => expect(screen.getByTestId('subheader')).toBeInTheDocument());
  });

  it('renders subheader with rooms title', async () => {
    render(<RoomPage />);
    await waitFor(() => expect(screen.getByText('page.rooms')).toBeInTheDocument());
  });

  it('renders room list', async () => {
    render(<RoomPage />);
    await waitFor(() => expect(screen.getByTestId('room-list')).toBeInTheDocument());
  });

  it('shows error alert when listFiltered API fails', async () => {
    vi.mocked(listFiltered).mockRejectedValue(new Error('fail'));
    render(<RoomPage />);
    await waitFor(() => expect(screen.getByTestId('alert')).toBeInTheDocument());
  });
});
