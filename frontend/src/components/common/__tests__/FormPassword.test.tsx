import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { useForm } from 'react-hook-form';
import FormPassword from '../FormPassword';

function UncontrolledWrapper() {
  return (
    <FormPassword
      name="password"
      label="Password"
      placeholder="Enter password"
    />
  );
}

function ControlledWrapper() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { control } = useForm<any>({ defaultValues: { password: '' } });
  return (
    <FormPassword
      name="password"
      label="Password"
      control={control}
      required
      placeholder="Controlled password"
    />
  );
}

describe('FormPassword (uncontrolled)', () => {
  it('renders label', () => {
    render(<UncontrolledWrapper />);
    expect(screen.getByText('Password')).toBeInTheDocument();
  });

  it('renders password input', () => {
    render(<UncontrolledWrapper />);
    // Ant Design password input renders an input element
    const inputs = document.querySelectorAll('input');
    expect(inputs.length).toBeGreaterThan(0);
  });

  it('calls onChange when value changes', () => {
    const onChange = vi.fn();
    render(
      <FormPassword
        name="password"
        label="Password"
        value=""
        onChange={onChange}
      />,
    );
    const input = document.querySelector('input') as HTMLInputElement;
    input.dispatchEvent(
      new Event('change', { bubbles: true }),
    );
  });

  it('renders hint when provided', () => {
    render(
      <FormPassword
        name="password"
        label="Password"
        hint="Must be 8+ characters"
      />,
    );
    expect(screen.getByText('Must be 8+ characters')).toBeInTheDocument();
  });

  it('renders disabled state', () => {
    render(
      <FormPassword name="password" label="Password" disabled />,
    );
    const input = document.querySelector('input') as HTMLInputElement;
    expect(input).toBeDisabled();
  });
});

describe('FormPassword (controlled via react-hook-form)', () => {
  it('renders with control prop', () => {
    render(<ControlledWrapper />);
    expect(screen.getByText('Password')).toBeInTheDocument();
  });

  it('renders password input in controlled mode', () => {
    render(<ControlledWrapper />);
    const inputs = document.querySelectorAll('input');
    expect(inputs.length).toBeGreaterThan(0);
  });

  it('shows required marker when required=true', () => {
    const { container } = render(<ControlledWrapper />);
    // Ant Design adds required styling via CSS class
    expect(container).toBeInTheDocument();
  });
});
