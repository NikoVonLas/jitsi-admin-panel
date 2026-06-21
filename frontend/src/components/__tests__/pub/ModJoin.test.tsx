import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ModJoin from '../../pub/ModJoin';

vi.mock('../../../i18n', () => ({
  useTr: () => (key: string) => key,
}));

vi.mock('../../../store/appconfig', () => ({
  useAppConfig: (selector: (s: { config: { logo_url: string } }) => unknown) =>
    selector({ config: { logo_url: '' } }),
}));

describe('ModJoin', () => {
  it('renders without crashing', () => {
    render(<ModJoin />);
  });

  it('renders logo image', () => {
    render(<ModJoin />);
    const img = document.querySelector('img[alt="logo"]');
    expect(img).toBeInTheDocument();
  });

  it('renders join as moderator heading', () => {
    render(<ModJoin />);
    expect(screen.getByText('meeting.join_as_mod')).toBeInTheDocument();
  });

  it('renders three input fields for host key', () => {
    render(<ModJoin />);
    const inputs = document.querySelectorAll('input[type="text"]');
    expect(inputs.length).toBe(3);
  });

  it('renders meeting name when provided', () => {
    render(<ModJoin name="My Meeting Room" />);
    expect(screen.getByText('My Meeting Room')).toBeInTheDocument();
  });

  it('renders too_early error alert', () => {
    render(<ModJoin error="too_early" />);
    expect(screen.getByText('err.too_early')).toBeInTheDocument();
  });

  it('renders invalid error alert', () => {
    render(<ModJoin error="invalid" />);
    expect(screen.getByText('err.host_key_invalid')).toBeInTheDocument();
  });

  it('shows participant url section when participantUrl is provided', () => {
    render(<ModJoin participantUrl="https://example.com/j/abc123" />);
    expect(screen.getByText('https://example.com/j/abc123')).toBeInTheDocument();
  });

  it('does not show participant section when participantUrl is empty', () => {
    render(<ModJoin participantUrl="" />);
    expect(screen.queryByText('meeting.link')).toBeNull();
  });

  it('calls onCopyUrl when copy button clicked', () => {
    const onCopyUrl = vi.fn();
    render(<ModJoin participantUrl="https://example.com/j/abc" onCopyUrl={onCopyUrl} />);
    const copyButton = document.querySelector('button[title="btn.copy"]');
    if (copyButton) fireEvent.click(copyButton);
    expect(onCopyUrl).toHaveBeenCalled();
  });

  it('shows share button when canShare is true', () => {
    render(<ModJoin participantUrl="https://example.com/j/abc" canShare={true} />);
    const shareButton = document.querySelector('button[title="btn.share"]');
    expect(shareButton).toBeInTheDocument();
  });

  it('does not show share button when canShare is false', () => {
    render(<ModJoin participantUrl="https://example.com/j/abc" canShare={false} />);
    const shareButton = document.querySelector('button[title="btn.share"]');
    expect(shareButton).toBeNull();
  });

  it('join button is disabled when hostKey is less than 9 chars', () => {
    render(<ModJoin />);
    const joinButton = screen.getByText('btn.join').closest('button');
    expect(joinButton).toBeDisabled();
  });

  it('inputs accept text input', () => {
    render(<ModJoin />);
    const inputs = document.querySelectorAll('input[type="text"]');
    fireEvent.change(inputs[0], { target: { value: 'abc' } });
    expect((inputs[0] as HTMLInputElement).value).toBe('abc');
  });

  it('shows qr image when qrDataUrl is provided', () => {
    render(<ModJoin participantUrl="https://example.com/j/abc" qrDataUrl="data:image/png;base64,abc" />);
    const qrImg = document.querySelector('img[alt="QR"]');
    expect(qrImg).toBeInTheDocument();
  });
});
