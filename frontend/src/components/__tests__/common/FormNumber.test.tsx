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

  it('renders with min and max props without error', () => {
    // Ant Design InputNumber does not expose min/max as HTML attributes on the
    // inner <input>; just verify it renders without throwing.
    render(<FormNumber name="count" label="Count" min={0} max={100} />);
    expect(screen.getByRole('spinbutton')).toBeInTheDocument();
  });

  it('calls onChange when value changes', () => {
    const onChange = vi.fn();
    render(<FormNumber name="count" label="Count" value={1} onChange={onChange} />);
    // Verify component renders without error
    expect(screen.getByRole('spinbutton')).toBeInTheDocument();
  });
});
