import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import CallJoinPage from '../CallJoinPage';

vi.mock('react-router-dom', () => ({
  useParams: () => ({ uuid: 'call-uuid-123' }),
}));

vi.mock('../../../../i18n', () => ({
  useTr: () => (key: string) => key,
}));

vi.mock('../../../../lib/api', () => ({
  actionById: vi.fn(),
}));

vi.mock('../../../../hooks/useIntercom', () => ({
  delMessage: vi.fn(),
}));

vi.mock('../../../../components/common/Spinner', () => ({
  default: ({ children }: { children?: React.ReactNode }) => (
    <div data-testid="spinner">{children}</div>
  ),
}));

vi.mock('../../../../components/common/AlertWarning', () => ({
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="alert">{children}</div>
  ),
}));

import { actionById } from '../../../../lib/api';
import { delMessage } from '../../../../hooks/useIntercom';

const testMsg = {
  id: 'call-uuid-123',
  intercom_attr: { url: 'https://jitsi.example.com/call' },
};

let locationReplaceMock: ReturnType<typeof vi.fn>;

describe('CallJoinPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Re-apply default mock implementation after clearAllMocks
    vi.mocked(actionById).mockResolvedValue({ id: 'x' });
    localStorage.clear();
    locationReplaceMock = vi.fn();
    vi.stubGlobal('location', {
      replace: locationReplaceMock,
      href: 'http://localhost/',
      origin: 'http://localhost',
      search: '',
      pathname: '/',
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    localStorage.clear();
  });

  it('renders spinner when message is in localStorage but actionById is pending', () => {
    vi.mocked(actionById).mockReturnValue(new Promise(() => {}));
    localStorage.setItem('msg-call-uuid-123', JSON.stringify(testMsg));
    render(<CallJoinPage />);
    expect(screen.getByTestId('spinner')).toBeInTheDocument();
  });

  it('shows joining status text when spinner is visible', () => {
    vi.mocked(actionById).mockReturnValue(new Promise(() => {}));
    localStorage.setItem('msg-call-uuid-123', JSON.stringify(testMsg));
    render(<CallJoinPage />);
    expect(screen.getByText('status.joining')).toBeInTheDocument();
  });

  it('shows error when message not in localStorage', async () => {
    render(<CallJoinPage />);
    await waitFor(() => expect(screen.getByTestId('alert')).toBeInTheDocument());
    expect(screen.getByText('err.generic')).toBeInTheDocument();
  });

  it('redirects when message found in localStorage', async () => {
    localStorage.setItem('msg-call-uuid-123', JSON.stringify(testMsg));
    render(<CallJoinPage />);
    await waitFor(() =>
      expect(locationReplaceMock).toHaveBeenCalledWith('https://jitsi.example.com/call')
    );
  });

  it('calls delMessage after accepting call', async () => {
    localStorage.setItem('msg-call-uuid-123', JSON.stringify(testMsg));
    render(<CallJoinPage />);
    await waitFor(() => expect(delMessage).toHaveBeenCalledWith('call-uuid-123'));
  });

  it('shows error when actionById fails', async () => {
    vi.mocked(actionById).mockRejectedValue(new Error('fail'));
    localStorage.setItem('msg-call-uuid-123', JSON.stringify(testMsg));
    render(<CallJoinPage />);
    await waitFor(() => expect(screen.getByTestId('alert')).toBeInTheDocument());
  });
});
