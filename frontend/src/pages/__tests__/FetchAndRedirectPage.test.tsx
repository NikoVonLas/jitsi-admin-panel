import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import FetchAndRedirectPage from '../FetchAndRedirectPage';

vi.mock('react-router-dom', () => ({
  useParams: () => ({ code: 'short-code-123' }),
}));

vi.mock('../../i18n', () => ({
  useTr: () => (key: string) => key,
}));

vi.mock('../../lib/api', () => ({
  action: vi.fn(),
}));

vi.mock('../../components/common/Spinner', () => ({
  default: () => <div data-testid="spinner">Loading...</div>,
}));

vi.mock('../../components/common/AlertWarning', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div data-testid="alert">{children}</div>,
}));

import { action } from '../../lib/api';

let locationReplaceMock: ReturnType<typeof vi.fn>;

describe('FetchAndRedirectPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
  });

  it('renders Spinner while loading', () => {
    vi.mocked(action).mockReturnValue(new Promise(() => {}));
    render(<FetchAndRedirectPage endpoint="/api/pub/test" />);
    expect(screen.getByTestId('spinner')).toBeInTheDocument();
  });

  it('redirects on successful action', async () => {
    vi.mocked(action).mockResolvedValue({ url: 'https://jitsi.example.com/room' });
    render(<FetchAndRedirectPage endpoint="/api/pub/test" />);
    await waitFor(() => expect(locationReplaceMock).toHaveBeenCalledWith('https://jitsi.example.com/room'));
  });

  it('shows error alert when action fails', async () => {
    vi.mocked(action).mockRejectedValue(new Error('fail'));
    render(<FetchAndRedirectPage endpoint="/api/pub/test" />);
    await waitFor(() => expect(screen.getByTestId('alert')).toBeInTheDocument());
    expect(screen.getByText('err.generic')).toBeInTheDocument();
  });

  it('shows error alert when url is missing in response', async () => {
    vi.mocked(action).mockResolvedValue({ url: null });
    render(<FetchAndRedirectPage endpoint="/api/pub/test" />);
    await waitFor(() => expect(screen.getByTestId('alert')).toBeInTheDocument());
  });

  it('calls action with correct endpoint and code', async () => {
    vi.mocked(action).mockResolvedValue({ url: 'https://example.com' });
    render(<FetchAndRedirectPage endpoint="/api/pub/meeting/join" />);
    await waitFor(() => expect(action).toHaveBeenCalledWith('/api/pub/meeting/join', { short_code: 'short-code-123' }));
  });
});
