import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import FormTextarea from '../../common/FormTextarea';

describe('FormTextarea', () => {
  it('renders a textarea', () => {
    render(<FormTextarea label="Notes" name="notes" value="" />);
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('renders the label', () => {
    render(<FormTextarea label="Description" name="desc" value="" />);
    expect(screen.getByText('Description')).toBeInTheDocument();
  });

  it('shows current value', () => {
    render(<FormTextarea label="Notes" name="notes" value="Some text" />);
    expect(screen.getByDisplayValue('Some text')).toBeInTheDocument();
  });

  it('calls onChange when value changes', () => {
    const onChange = vi.fn();
    render(
      <FormTextarea label="Notes" name="notes" value="" onChange={onChange} />,
    );
    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: 'new text' },
    });
    expect(onChange).toHaveBeenCalledWith('new text');
  });

  it('renders disabled', () => {
    render(<FormTextarea label="Notes" name="notes" value="" disabled />);
    expect(screen.getByRole('textbox')).toBeDisabled();
  });

  it('renders readOnly', () => {
    render(<FormTextarea label="Notes" name="notes" value="text" readOnly />);
    expect(screen.getByRole('textbox')).toHaveAttribute('readonly');
  });
});
