import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import FormColor from '../FormColor';

describe('FormColor', () => {
  it('renders the label', () => {
    render(<FormColor name="color" label="Brand Color" value="#ff0000" />);
    expect(screen.getByText('Brand Color')).toBeInTheDocument();
  });

  it('renders a text input with the current value', () => {
    render(<FormColor name="color" label="Color" value="#abcdef" />);
    const input = document.querySelector('input#color') as HTMLInputElement;
    expect(input).toBeInTheDocument();
    expect(input.value).toBe('#abcdef');
  });

  it('calls onChange when text input changes', () => {
    const onChange = vi.fn();
    render(<FormColor name="color" label="Color" value="#000000" onChange={onChange} />);
    const input = document.querySelector('input#color') as HTMLInputElement;
    fireEvent.change(input, { target: { value: '#ffffff' } });
    expect(onChange).toHaveBeenCalledWith('#ffffff');
  });

  it('renders reset button when value is set and defaultValue provided', () => {
    render(<FormColor name="color" label="Color" value="#ff0000" defaultValue="" onChange={vi.fn()} />);
    expect(screen.getByText('×')).toBeInTheDocument();
  });

  it('calls onChange with defaultValue when reset button clicked', () => {
    const onChange = vi.fn();
    render(<FormColor name="color" label="Color" value="#ff0000" defaultValue="#000000" onChange={onChange} />);
    fireEvent.click(screen.getByText('×'));
    expect(onChange).toHaveBeenCalledWith('#000000');
  });

  it('does not render reset button when value is empty', () => {
    render(<FormColor name="color" label="Color" value="" defaultValue="" onChange={vi.fn()} />);
    expect(screen.queryByText('×')).toBeNull();
  });
});
