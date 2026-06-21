import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useModJoinPage, JoinPageError } from '../useModJoinPage';

vi.mock('qrcode', () => ({
  toDataURL: vi.fn().mockResolvedValue('data:image/png;base64,abc'),
}));

const mockFetchInfo = vi.fn();
const mockFetchModeratorLink = vi.fn();
const mockSubmitJoin = vi.fn();

const defaultConfig = {
  uuid: 'test-uuid',
  participantPathPrefix: '/j/',
  fetchInfo: mockFetchInfo,
  fetchModeratorLink: mockFetchModeratorLink,
  submitJoin: mockSubmitJoin,
};

let locationReplaceMock: ReturnType<typeof vi.fn>;

describe('useModJoinPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
    mockFetchInfo.mockResolvedValue({ name: 'Test Meeting', short_code: 'abc123' });
    mockFetchModeratorLink.mockResolvedValue(undefined);
    mockSubmitJoin.mockResolvedValue({ url: 'https://jitsi.example.com/test' });

    locationReplaceMock = vi.fn();
    vi.stubGlobal('location', {
      replace: locationReplaceMock,
      href: 'http://localhost/',
      origin: 'http://localhost',
      search: '',
      pathname: '/',
      hash: '',
      assign: vi.fn(),
      reload: vi.fn(),
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    sessionStorage.clear();
  });

  it('returns initial state before init completes', () => {
    mockFetchInfo.mockImplementation(() => new Promise(() => {}));
    const { result } = renderHook(() => useModJoinPage(defaultConfig));
    expect(result.current.ready).toBe(false);
    expect(result.current.joining).toBe(false);
    expect(result.current.error).toBe('');
    expect(result.current.name).toBe('');
    expect(result.current.participantUrl).toBe('');
    expect(result.current.qrDataUrl).toBe('');
    expect(result.current.copiedUrl).toBe(false);
  });

  it('sets ready=true after init without oidc session', async () => {
    const { result } = renderHook(() => useModJoinPage(defaultConfig));
    await waitFor(() => expect(result.current.ready).toBe(true));
  });

  it('sets name and shortCode from fetchInfo', async () => {
    const { result } = renderHook(() => useModJoinPage(defaultConfig));
    await waitFor(() => expect(result.current.ready).toBe(true));
    expect(result.current.name).toBe('Test Meeting');
  });

  it('builds participantUrl from shortCode', async () => {
    const { result } = renderHook(() => useModJoinPage(defaultConfig));
    await waitFor(() => expect(result.current.participantUrl).toContain('/j/abc123'));
  });

  it('remains ready even when fetchInfo throws', async () => {
    mockFetchInfo.mockRejectedValue(new Error('fetch error'));
    const { result } = renderHook(() => useModJoinPage(defaultConfig));
    await waitFor(() => expect(result.current.ready).toBe(true));
    expect(result.current.name).toBe('');
  });

  it('redirects when oidc session exists and mod url is returned', async () => {
    sessionStorage.setItem('oidc_authenticated', 'ok');
    const modUrl = 'https://jitsi.example.com/mod';
    mockFetchModeratorLink.mockResolvedValue(modUrl);
    renderHook(() => useModJoinPage(defaultConfig));
    await waitFor(() => expect(locationReplaceMock).toHaveBeenCalledWith(modUrl));
  });

  it('sets ready=true when oidc session exists but no mod url', async () => {
    sessionStorage.setItem('oidc_authenticated', 'ok');
    mockFetchModeratorLink.mockResolvedValue(undefined);
    const { result } = renderHook(() => useModJoinPage(defaultConfig));
    await waitFor(() => expect(result.current.ready).toBe(true));
  });

  it('onSubmit calls submitJoin and redirects on success', async () => {
    const { result } = renderHook(() => useModJoinPage(defaultConfig));
    await waitFor(() => expect(result.current.ready).toBe(true));
    await act(async () => {
      await result.current.onSubmit('abc123xyz');
    });
    expect(locationReplaceMock).toHaveBeenCalledWith('https://jitsi.example.com/test');
  });

  it('onSubmit sets error=invalid on generic error', async () => {
    mockSubmitJoin.mockRejectedValue(new Error('network error'));
    const { result } = renderHook(() => useModJoinPage(defaultConfig));
    await waitFor(() => expect(result.current.ready).toBe(true));
    await act(async () => {
      await result.current.onSubmit('abc123xyz');
    });
    expect(result.current.error).toBe('invalid');
    expect(result.current.joining).toBe(false);
  });

  it('onSubmit sets error code from JoinPageError', async () => {
    mockSubmitJoin.mockRejectedValue(new JoinPageError('too_early'));
    const { result } = renderHook(() => useModJoinPage(defaultConfig));
    await waitFor(() => expect(result.current.ready).toBe(true));
    await act(async () => {
      await result.current.onSubmit('abc123xyz');
    });
    expect(result.current.error).toBe('too_early');
  });

  it('onSubmit clears error before re-submitting', async () => {
    mockSubmitJoin.mockRejectedValue(new JoinPageError('too_early'));
    const { result } = renderHook(() => useModJoinPage(defaultConfig));
    await waitFor(() => expect(result.current.ready).toBe(true));
    await act(async () => { await result.current.onSubmit('abc123xyz'); });
    expect(result.current.error).toBe('too_early');
    mockSubmitJoin.mockResolvedValue({ url: 'https://ok.example.com' });
    await act(async () => { await result.current.onSubmit('abc123xyz'); });
    expect(result.current.error).toBe('');
  });

  it('canShare reflects navigator.share availability', async () => {
    const share = vi.fn();
    Object.defineProperty(navigator, 'share', { value: share, configurable: true });
    const { result } = renderHook(() => useModJoinPage(defaultConfig));
    await waitFor(() => expect(result.current.ready).toBe(true));
    expect(result.current.canShare).toBe(true);
    Object.defineProperty(navigator, 'share', { value: undefined, configurable: true });
  });

  it('onCopyUrl calls clipboard.writeText and sets copiedUrl', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText },
      configurable: true,
    });
    const { result } = renderHook(() => useModJoinPage(defaultConfig));
    await waitFor(() => expect(result.current.ready).toBe(true));
    await act(async () => {
      await result.current.onCopyUrl();
    });
    expect(writeText).toHaveBeenCalled();
    expect(result.current.copiedUrl).toBe(true);
  });

  it('onShareUrl calls navigator.share when available', async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'share', { value: share, configurable: true });
    const { result } = renderHook(() => useModJoinPage(defaultConfig));
    await waitFor(() => expect(result.current.ready).toBe(true));
    await act(async () => {
      await result.current.onShareUrl();
    });
    expect(share).toHaveBeenCalled();
  });
});

describe('JoinPageError', () => {
  it('has correct code property', () => {
    const e = new JoinPageError('too_early');
    expect(e.code).toBe('too_early');
    expect(e instanceof Error).toBe(true);
  });

  it('has correct message', () => {
    const e = new JoinPageError('invalid');
    expect(e.message).toBe('invalid');
  });
});
