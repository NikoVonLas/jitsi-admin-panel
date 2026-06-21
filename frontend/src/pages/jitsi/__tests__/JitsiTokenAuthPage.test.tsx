import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import JitsiTokenAuthPage from '../JitsiTokenAuthPage';

vi.mock('../../../lib/api', () => ({
  action: vi.fn().mockResolvedValue({ url: 'https://jitsi.example.com/room' }),
}));

vi.mock('../../../lib/http', () => ({
  httpPost: vi.fn().mockResolvedValue({ status: 200, json: async () => ({}) }),
}));

vi.mock('../../../i18n', () => ({
  t: (key: string) => key,
}));

import { action } from '../../../lib/api';
import { httpPost } from '../../../lib/http';

let locationReplaceMock: ReturnType<typeof vi.fn>;
let locationHrefSetter: ReturnType<typeof vi.fn>;

describe('JitsiTokenAuthPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    locationReplaceMock = vi.fn();
    locationHrefSetter = vi.fn();
    let _href = 'http://localhost/';
    vi.stubGlobal('location', {
      replace: locationReplaceMock,
      get href() { return _href; },
      set href(v: string) { _href = v; locationHrefSetter(v); },
      origin: 'http://localhost',
      search: '?room=testroom',
      pathname: '/jitsi/token',
      hash: '',
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders without crashing', () => {
    render(<JitsiTokenAuthPage />);
  });

  it('shows initial checking message', () => {
    render(<JitsiTokenAuthPage />);
    expect(screen.getByText('jitsi.checking')).toBeInTheDocument();
  });

  it('shows error when room param is missing', async () => {
    vi.stubGlobal('location', {
      replace: locationReplaceMock,
      href: 'http://localhost/',
      origin: 'http://localhost',
      search: '',
      pathname: '/jitsi/token',
    });
    render(<JitsiTokenAuthPage />);
    await waitFor(() => expect(screen.getByText('jitsi.err_no_room')).toBeInTheDocument());
  });

  it('redirects to OIDC when httpPost returns non-200', async () => {
    vi.mocked(httpPost).mockResolvedValue({ status: 401, json: async () => ({}) } as Response);
    render(<JitsiTokenAuthPage />);
    await waitFor(() => expect(locationHrefSetter).toHaveBeenCalled());
    expect(locationHrefSetter.mock.calls[0][0]).toContain('/api/adm/oidc/redirect');
  });

  it('redirects to Jitsi when authenticated and link found', async () => {
    vi.mocked(httpPost).mockResolvedValue({ status: 200, json: async () => ({}) } as Response);
    vi.mocked(action).mockResolvedValue({ url: 'https://jitsi.example.com/myroom' });
    render(<JitsiTokenAuthPage />);
    await waitFor(() => expect(locationReplaceMock).toHaveBeenCalledWith('https://jitsi.example.com/myroom'));
  });

  it('shows error when link not found', async () => {
    vi.mocked(httpPost).mockResolvedValue({ status: 200, json: async () => ({}) } as Response);
    vi.mocked(action).mockResolvedValue({ url: null });
    render(<JitsiTokenAuthPage />);
    await waitFor(() => expect(screen.getByText('jitsi.err_no_resource')).toBeInTheDocument());
  });
});
