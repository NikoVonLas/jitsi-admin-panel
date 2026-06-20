import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import FormCheckbox from '../../common/FormCheckbox';

describe('FormCheckbox', () => {
  it('renders a checkbox', () => {
    render(<FormCheckbox label="Enable feature" />);
    expect(screen.getByRole('checkbox')).toBeInTheDocument();
  });

  it('renders the label text', () => {
    render(<FormCheckbox label="Accept terms" />);
    expect(screen.getByText('Accept terms')).toBeInTheDocument();
  });

  it('renders checked when checked=true', () => {
    render(<FormCheckbox label="Checked" checked />);
    expect(screen.getByRole('checkbox')).toBeChecked();
  });

  it('renders unchecked when checked=false', () => {
    render(<FormCheckbox label="Unchecked" checked={false} />);
    expect(screen.getByRole('checkbox')).not.toBeChecked();
  });

  it('calls onChange with true when checked', () => {
    const onChange = vi.fn();
    render(<FormCheckbox label="Test" checked={false} onChange={onChange} />);
    fireEvent.click(screen.getByRole('checkbox'));
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it('renders disabled when disabled=true', () => {
    render(<FormCheckbox label="Disabled" disabled />);
    expect(screen.getByRole('checkbox')).toBeDisabled();
  });

  it('renders hint text when provided', () => {
    render(<FormCheckbox label="Label" hint="This is a hint" />);
    expect(screen.getByText('This is a hint')).toBeInTheDocument();
  });
});
