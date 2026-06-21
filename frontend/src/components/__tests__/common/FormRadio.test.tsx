import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import FormRadio from '../../common/FormRadio';

const OPTIONS: [string, string][] = [
  ['none', 'None'],
  ['local', 'Local'],
  ['jaas', 'JaaS'],
];

describe('FormRadio', () => {
  it('renders all options', () => {
    render(<FormRadio options={OPTIONS} />);
    expect(screen.getByText('None')).toBeInTheDocument();
    expect(screen.getByText('Local')).toBeInTheDocument();
    expect(screen.getByText('JaaS')).toBeInTheDocument();
  });

  it('renders label when provided', () => {
    render(<FormRadio label="Auth Type" options={OPTIONS} />);
    expect(screen.getByText('Auth Type')).toBeInTheDocument();
  });

  it('marks the selected option', () => {
    render(<FormRadio options={OPTIONS} value="local" />);
    const radios = screen.getAllByRole('radio');
    const localRadio = radios.find((r) => (r as HTMLInputElement).value === 'local');
    expect(localRadio).toBeChecked();
  });

  it('calls onChange when an option is selected', () => {
    const onChange = vi.fn();
    render(<FormRadio options={OPTIONS} value="none" onChange={onChange} />);
    const radios = screen.getAllByRole('radio');
    const jaasRadio = radios.find((r) => (r as HTMLInputElement).value === 'jaas')!;
    fireEvent.click(jaasRadio);
    expect(onChange).toHaveBeenCalledWith('jaas');
  });

  it('renders disabled state', () => {
    render(<FormRadio options={OPTIONS} value="none" disabled />);
    const radios = screen.getAllByRole('radio');
    radios.forEach((r) => expect(r).toBeDisabled());
  });
});
