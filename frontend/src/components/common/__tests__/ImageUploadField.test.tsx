import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ImageUploadField from '../ImageUploadField';

vi.mock('../../../i18n', () => ({
  useTr: () => (k: string) => k,
}));

const defaultProps = {
  label: 'Logo',
  previewUrl: '/logo.svg',
  onUpload: vi.fn().mockResolvedValue(undefined),
  onReset: vi.fn().mockResolvedValue(undefined),
};

describe('ImageUploadField', () => {
  it('renders the label', () => {
    render(<ImageUploadField {...defaultProps} />);
    expect(screen.getByText('Logo')).toBeInTheDocument();
  });

  it('renders upload button', () => {
    render(<ImageUploadField {...defaultProps} />);
    expect(screen.getByText('form.logo_upload')).toBeInTheDocument();
  });

  it('renders reset button', () => {
    render(<ImageUploadField {...defaultProps} />);
    expect(screen.getByText('form.logo_reset')).toBeInTheDocument();
  });

  it('renders preview image with correct src', () => {
    render(<ImageUploadField {...defaultProps} />);
    const img = document.querySelector('img') as HTMLImageElement;
    expect(img).toBeInTheDocument();
    expect(img.src).toContain('/logo.svg');
  });

  it('renders hidden file input', () => {
    render(<ImageUploadField {...defaultProps} />);
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    expect(input).toBeInTheDocument();
    expect(input.style.display).toBe('none');
  });

  it('calls onUpload when a file is selected', async () => {
    const onUpload = vi.fn().mockResolvedValue(undefined);
    render(<ImageUploadField {...defaultProps} onUpload={onUpload} />);
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['img'], 'test.png', { type: 'image/png' });
    await waitFor(() => {
      fireEvent.change(input, { target: { files: [file] } });
    });
    expect(onUpload).toHaveBeenCalledWith(file);
  });

  it('shows error message when upload fails', async () => {
    const onUpload = vi.fn().mockRejectedValue(new Error('fail'));
    render(<ImageUploadField {...defaultProps} onUpload={onUpload} />);
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['img'], 'test.png', { type: 'image/png' });
    fireEvent.change(input, { target: { files: [file] } });
    await waitFor(() => {
      expect(screen.getByText('err.update')).toBeInTheDocument();
    });
  });

  it('accepts custom accept attribute', () => {
    render(<ImageUploadField {...defaultProps} accept="image/png" />);
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    expect(input.accept).toBe('image/png');
  });
});
