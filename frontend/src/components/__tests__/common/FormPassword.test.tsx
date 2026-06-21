import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import FormPassword from '../../common/FormPassword';

describe('FormPassword', () => {
  it('renders label text', () => {
    render(<FormPassword label="Password" name="password" />);
    expect(screen.getByText('Password')).toBeInTheDocument();
  });

  it('renders a password input', () => {
    render(<FormPassword label="Password" name="password" value="" />);
    const input = document.querySelector('input[type="password"]');
    expect(input).toBeInTheDocument();
  });

  it('calls onChange when value changes', () => {
    const onChange = vi.fn();
    render(<FormPassword label="Password" name="password" value="" onChange={onChange} />);
    const input = document.querySelector('input[type="password"]')!;
    fireEvent.change(input, { target: { value: 'secret123' } });
    expect(onChange).toHaveBeenCalledWith('secret123');
  });

  it('does not throw when no onChange provided', () => {
    render(<FormPassword label="Password" name="password" value="" />);
    const input = document.querySelector('input[type="password"]')!;
    fireEvent.change(input, { target: { value: 'abc' } });
  });

  it('renders hint text', () => {
    render(<FormPassword label="Password" name="password" hint="Min 14 chars" />);
    expect(screen.getByText('Min 14 chars')).toBeInTheDocument();
  });

  it('renders disabled state', () => {
    render(<FormPassword label="Password" name="password" disabled />);
    const input = document.querySelector('input[type="password"]')!;
    expect(input).toBeDisabled();
  });

  it('renders placeholder', () => {
    render(<FormPassword label="Password" name="password" placeholder="Enter password" />);
    const input = document.querySelector('input[type="password"]')!;
    expect(input).toHaveAttribute('placeholder', 'Enter password');
  });
});
