import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import JoinByMeetingPage from '../JoinByMeetingPage';

vi.mock('react-router-dom', () => ({
  useParams: () => ({ uuid: 'meeting-uuid-1' }),
}));

vi.mock('../../../lib/http', () => ({
  httpPost: vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => [{ name: 'Test Meeting', short_code: 'abc123' }],
  }),
}));

vi.mock('../../../lib/api', () => ({
  getById: vi.fn().mockResolvedValue({ moderator_url: undefined }),
}));

vi.mock('../../../hooks/useModJoinPage', () => ({
  useModJoinPage: vi.fn().mockReturnValue({
    ready: false,
    joining: false,
    error: '',
    name: '',
    participantUrl: '',
    qrDataUrl: '',
    canShare: false,
    copiedUrl: false,
    onSubmit: vi.fn(),
    onCopyUrl: vi.fn(),
    onShareUrl: vi.fn(),
  }),
  JoinPageError: class JoinPageError extends Error {
    code: string;
    constructor(code: string) { super(code); this.code = code; }
  },
}));

vi.mock('../../../components/pub/ModJoin', () => ({
  default: () => <div data-testid="mod-join">ModJoin</div>,
}));

vi.mock('../../../components/common/Spinner', () => ({
  default: () => <div data-testid="spinner">Loading</div>,
}));

import { useModJoinPage } from '../../../hooks/useModJoinPage';

describe('JoinByMeetingPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders spinner when not ready', () => {
    vi.mocked(useModJoinPage).mockReturnValue({
      ready: false, joining: false, error: '', name: '', participantUrl: '',
      qrDataUrl: '', canShare: false, copiedUrl: false,
      onSubmit: vi.fn(), onCopyUrl: vi.fn(), onShareUrl: vi.fn(),
    });
    render(<JoinByMeetingPage />);
    expect(screen.getByTestId('spinner')).toBeInTheDocument();
  });

  it('renders ModJoin when ready', () => {
    vi.mocked(useModJoinPage).mockReturnValue({
      ready: true, joining: false, error: '', name: 'Test Meeting',
      participantUrl: 'http://example.com/j/abc',
      qrDataUrl: '', canShare: false, copiedUrl: false,
      onSubmit: vi.fn(), onCopyUrl: vi.fn(), onShareUrl: vi.fn(),
    });
    render(<JoinByMeetingPage />);
    expect(screen.getByTestId('mod-join')).toBeInTheDocument();
  });
});
