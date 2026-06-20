import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

vi.mock('../../../i18n', () => ({
  useTr: () => (k: string) => k,
  t: (k: string) => k,
}));

import ButtonSubmit from '../../common/ButtonSubmit';

describe('ButtonSubmit', () => {
  it('renders a button', () => {
    render(<ButtonSubmit />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('uses default i18n label', () => {
    render(<ButtonSubmit />);
    expect(screen.getByText('btn.submit')).toBeInTheDocument();
  });

  it('uses custom label when provided', () => {
    render(<ButtonSubmit label="Save Changes" />);
    expect(screen.getByText('Save Changes')).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const onClick = vi.fn();
    render(<ButtonSubmit onClick={onClick} />);
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalled();
  });

  it('renders disabled', () => {
    render(<ButtonSubmit disabled />);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('renders with submit htmlType by default', () => {
    render(<ButtonSubmit />);
    expect(screen.getByRole('button')).toHaveAttribute('type', 'submit');
  });
});
