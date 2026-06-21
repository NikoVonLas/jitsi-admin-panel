import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import FormSelect from '../../common/FormSelect';

const OPTIONS: [string, string][] = [
  ['none', 'Anonymous'],
  ['token', 'Token'],
  ['jaas', '8x8'],
];

describe('FormSelect', () => {
  it('renders a select element', () => {
    render(
      <FormSelect name="auth" label="Auth Type" options={OPTIONS} />,
    );
    // antd Select renders a combobox
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('renders the label', () => {
    render(
      <FormSelect name="auth" label="Auth Type" options={OPTIONS} />,
    );
    expect(screen.getByText('Auth Type')).toBeInTheDocument();
  });

  it('renders without crashing when disabled', () => {
    render(
      <FormSelect name="auth" label="Disabled" options={OPTIONS} disabled />,
    );
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('renders required mark when required=true', () => {
    render(
      <FormSelect name="auth" label="Required" options={OPTIONS} required />,
    );
    expect(screen.getByText('Required')).toBeInTheDocument();
  });
});
