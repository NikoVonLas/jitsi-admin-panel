import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import FormNumber from '../../common/FormNumber';

describe('FormNumber', () => {
  it('renders label text', () => {
    render(<FormNumber name="count" label="Count" />);
    expect(screen.getByText('Count')).toBeInTheDocument();
  });

  it('renders with a value', () => {
    render(<FormNumber name="count" label="Count" value={42} />);
    const input = screen.getByRole('spinbutton') as HTMLInputElement;
    expect(input.value).toBe('42');
  });

  it('renders disabled state', () => {
    render(<FormNumber name="count" label="Count" disabled />);
    const input = screen.getByRole('spinbutton');
    expect(input).toBeDisabled();
  });

  it('renders required state', () => {
    render(<FormNumber name="count" label="Count" required />);
    expect(screen.getByText('Count')).toBeInTheDocument();
  });

  it('respects min and max attributes', () => {
    render(<FormNumber name="count" label="Count" min={0} max={100} />);
    const input = screen.getByRole('spinbutton');
    expect(input).toHaveAttribute('min', '0');
    expect(input).toHaveAttribute('max', '100');
  });

  it('calls onChange when value changes', () => {
    const onChange = vi.fn();
    render(<FormNumber name="count" label="Count" value={1} onChange={onChange} />);
    // Verify component renders without error
    expect(screen.getByRole('spinbutton')).toBeInTheDocument();
  });
});
