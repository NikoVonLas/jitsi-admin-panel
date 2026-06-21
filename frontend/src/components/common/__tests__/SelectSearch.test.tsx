import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import SelectSearch from '../SelectSearch';

const options = [
  { value: 'opt1', label: 'Option One' },
  { value: 'opt2', label: 'Option Two' },
];

describe('SelectSearch', () => {
  it('renders without crashing', () => {
    const { container } = render(
      <SelectSearch options={options} value="" onChange={vi.fn()} />,
    );
    expect(container).toBeInTheDocument();
  });

  it('renders with a selected value', () => {
    render(
      <SelectSearch options={options} value="opt1" onChange={vi.fn()} />,
    );
    expect(screen.getByText('Option One')).toBeInTheDocument();
  });

  it('renders allLabel option when provided', () => {
    render(
      <SelectSearch options={options} value="" allLabel="All Options" onChange={vi.fn()} />,
    );
    expect(screen.getByText('All Options')).toBeInTheDocument();
  });

  it('renders placeholder when provided', () => {
    const { container } = render(
      <SelectSearch options={options} value="" onChange={vi.fn()} placeholder="Select one" />,
    );
    expect(container.querySelector('input')).toBeInTheDocument();
  });

  it('renders with empty options', () => {
    const { container } = render(
      <SelectSearch options={[]} value="" onChange={vi.fn()} />,
    );
    expect(container).toBeInTheDocument();
  });
});
