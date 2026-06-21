import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { useForm } from 'react-hook-form';
import FormUrl from '../FormUrl';

function ControlledWrapper() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { control } = useForm<any>({ defaultValues: { site_url: '' } });
  return (
    <FormUrl
      name="site_url"
      label="Site URL"
      control={control}
      required
      placeholder="https://example.com"
    />
  );
}

describe('FormUrl (controlled via react-hook-form)', () => {
  it('renders label in controlled mode', () => {
    render(<ControlledWrapper />);
    expect(screen.getByText('Site URL')).toBeInTheDocument();
  });

  it('renders input in controlled mode', () => {
    render(<ControlledWrapper />);
    const input = document.querySelector('input');
    expect(input).toBeInTheDocument();
  });

  it('renders placeholder in controlled mode', () => {
    render(<ControlledWrapper />);
    const input = document.querySelector('input') as HTMLInputElement;
    expect(input.placeholder).toBe('https://example.com');
  });
});
