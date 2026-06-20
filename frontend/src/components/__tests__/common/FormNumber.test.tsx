import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import FormNumber from '../../common/FormNumber';

describe('FormNumber', () => {
  it('renders a number input', () => {
    render(<FormNumber name="count" label="Count" value={5} />);
    expect(screen.getByRole('spinbutton')).toBeInTheDocument();
  });

  it('renders the label', () => {
    render(<FormNumber name="count" label="Item Count" value={0} />);
    expect(screen.getByText('Item Count')).toBeInTheDocument();
  });

  it('shows the current value', () => {
    render(<FormNumber name="count" label="Count" value={42} />);
    expect(screen.getByRole('spinbutton')).toHaveValue('42');
  });

  it('renders disabled', () => {
    render(<FormNumber name="count" label="Count" value={10} disabled />);
    expect(screen.getByRole('spinbutton')).toBeDisabled();
  });

  it('renders required', () => {
    render(<FormNumber name="count" label="Required Count" required value={0} />);
    expect(screen.getByText('Required Count')).toBeInTheDocument();
  });
});
