import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

vi.mock('../../../i18n', () => ({
  useTr: () => (k: string) => k,
  t: (k: string) => k,
}));

import ButtonCancel from '../../common/ButtonCancel';

describe('ButtonCancel', () => {
  it('renders a button', () => {
    render(<ButtonCancel />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('uses default i18n label', () => {
    render(<ButtonCancel />);
    expect(screen.getByText('btn.cancel')).toBeInTheDocument();
  });

  it('uses custom label', () => {
    render(<ButtonCancel label="Go Back" />);
    expect(screen.getByText('Go Back')).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const onClick = vi.fn();
    render(<ButtonCancel onClick={onClick} />);
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalled();
  });

  it('renders disabled', () => {
    render(<ButtonCancel disabled />);
    expect(screen.getByRole('button')).toBeDisabled();
  });
});
