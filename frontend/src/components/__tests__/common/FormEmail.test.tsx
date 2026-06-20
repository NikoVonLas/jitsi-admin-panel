import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import FormEmail from '../../common/FormEmail';

describe('FormEmail', () => {
  it('renders an email input', () => {
    render(<FormEmail label="Email" name="email" value="" />);
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('renders label text', () => {
    render(<FormEmail label="Your Email" name="email" value="" />);
    expect(screen.getByText('Your Email')).toBeInTheDocument();
  });

  it('shows the current value', () => {
    render(<FormEmail label="Email" name="email" value="test@example.com" />);
    expect(screen.getByDisplayValue('test@example.com')).toBeInTheDocument();
  });

  it('calls onChange when value changes', () => {
    const onChange = vi.fn();
    render(<FormEmail label="Email" name="email" value="" onChange={onChange} />);
    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: 'new@example.com' },
    });
    expect(onChange).toHaveBeenCalledWith('new@example.com');
  });

  it('renders disabled', () => {
    render(<FormEmail label="Email" name="email" value="" disabled />);
    expect(screen.getByRole('textbox')).toBeDisabled();
  });

  it('renders readOnly', () => {
    render(<FormEmail label="Email" name="email" value="test@x.com" readOnly />);
    expect(screen.getByRole('textbox')).toHaveAttribute('readonly');
  });
});
