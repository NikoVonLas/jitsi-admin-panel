import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

// Mock i18n
vi.mock('../../../i18n', () => ({
  useTr: () => (k: string) => k,
  t: (k: string) => k,
}));

// Mock copyText
vi.mock('../../../lib/common', async (importOriginal) => {
  const original = await importOriginal<typeof import('../../../lib/common')>();
  return {
    ...original,
    copyText: vi.fn().mockResolvedValue(undefined),
  };
});

import ButtonCopy from '../../common/ButtonCopy';
import { copyText } from '../../../lib/common';

const mockCopyText = copyText as ReturnType<typeof vi.fn>;

describe('ButtonCopy', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders a button', () => {
    render(<ButtonCopy text="copy me" />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('calls copyText with the provided text on click', async () => {
    render(<ButtonCopy text="hello world" />);
    fireEvent.click(screen.getByRole('button'));
    await waitFor(() => {
      expect(mockCopyText).toHaveBeenCalledWith('hello world');
    });
  });

  it('renders with small size by default', () => {
    const { container } = render(<ButtonCopy text="test" />);
    expect(container.querySelector('button')).not.toBeNull();
  });
});
