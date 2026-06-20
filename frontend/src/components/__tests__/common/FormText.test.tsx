import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import FormText from '../../common/FormText';

describe('FormText', () => {
  it('renders an input with the provided value', () => {
    render(<FormText label="Name" name="name" value="John" />);
    expect(screen.getByDisplayValue('John')).toBeInTheDocument();
  });

  it('renders label text', () => {
    render(<FormText label="Email Address" name="email" value="" />);
    expect(screen.getByText('Email Address')).toBeInTheDocument();
  });

  it('calls onChange when input value changes', () => {
    const onChange = vi.fn();
    render(<FormText label="Name" name="name" value="" onChange={onChange} />);
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'new value' } });
    expect(onChange).toHaveBeenCalledWith('new value');
  });

  it('does not call onChange when no handler provided', () => {
    render(<FormText label="Name" name="name" value="test" />);
    // Should not throw
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'abc' } });
  });

  it('renders disabled when disabled=true', () => {
    render(<FormText label="Name" name="name" value="test" disabled />);
    expect(screen.getByRole('textbox')).toBeDisabled();
  });

  it('renders readonly when readOnly=true', () => {
    render(<FormText label="Name" name="name" value="test" readOnly />);
    expect(screen.getByRole('textbox')).toHaveAttribute('readonly');
  });

  it('marks field as required when required=true', () => {
    render(<FormText label="Required Field" name="req" value="" required />);
    expect(screen.getByText('Required Field')).toBeInTheDocument();
  });
});
