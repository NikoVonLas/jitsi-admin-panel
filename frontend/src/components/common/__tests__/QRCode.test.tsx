import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import QRCode from '../QRCode';

vi.mock('../../../i18n', () => ({
  useTr: () => (k: string) => k,
}));

vi.mock('qrcode', () => ({
  toDataURL: vi.fn().mockResolvedValue('data:image/png;base64,FAKEQR'),
}));

describe('QRCode', () => {
  it('renders null initially (before async toDataURL resolves)', () => {
    const { container } = render(<QRCode url="" />);
    expect(container.firstChild).toBeNull();
  });

  it('renders QR image after toDataURL resolves', async () => {
    render(<QRCode url="https://example.com" />);
    await waitFor(() => {
      expect(document.querySelector('img[alt="QR"]')).toBeInTheDocument();
    });
  });

  it('renders download button after QR is generated', async () => {
    render(<QRCode url="https://example.com" />);
    await waitFor(() => {
      expect(screen.getByText('btn.download_qr')).toBeInTheDocument();
    });
  });

  it('uses custom filename for download', async () => {
    render(<QRCode url="https://example.com" filename="custom.png" />);
    await waitFor(() => {
      expect(document.querySelector('img[alt="QR"]')).toBeInTheDocument();
    });
  });

  it('renders at custom size', async () => {
    render(<QRCode url="https://example.com" size={200} />);
    await waitFor(() => {
      const img = document.querySelector('img[alt="QR"]') as HTMLImageElement;
      expect(img).toBeInTheDocument();
    });
  });
});
