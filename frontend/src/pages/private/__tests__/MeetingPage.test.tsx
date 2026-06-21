import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import MeetingPage from '../MeetingPage';

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

vi.mock('../../../components/pri/meeting/MeetingList', () => ({
  default: () => <div data-testid="meeting-list">MeetingList</div>,
}));

vi.mock('../../../components/pri/meeting/MeetingAdd', () => ({
  default: () => <div data-testid="meeting-add">MeetingAdd</div>,
}));

import { listFiltered } from '../../../lib/api';

describe('MeetingPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(listFiltered).mockResolvedValue({ items: [], total: 0 });
  });

  it('renders without crashing', async () => {
    render(<MeetingPage />);
    await waitFor(() => expect(screen.getByTestId('subheader')).toBeInTheDocument());
  });

  it('renders subheader with meetings title', async () => {
    render(<MeetingPage />);
    await waitFor(() => expect(screen.getByText('page.meetings')).toBeInTheDocument());
  });

  it('renders meeting list', async () => {
    render(<MeetingPage />);
    await waitFor(() => expect(screen.getByTestId('meeting-list')).toBeInTheDocument());
  });

  it('shows error alert when listFiltered API fails', async () => {
    vi.mocked(listFiltered).mockRejectedValue(new Error('fail'));
    render(<MeetingPage />);
    await waitFor(() => expect(screen.getByTestId('alert')).toBeInTheDocument());
  });
});
