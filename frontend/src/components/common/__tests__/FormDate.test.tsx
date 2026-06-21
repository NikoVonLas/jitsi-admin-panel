import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import FormDate from '../FormDate';

vi.mock('../../../i18n', () => ({
  useTr: () => (k: string) => k,
  useI18n: () => ({ lang: 'en', setLang: () => {}, t: (k: string) => k }),
}));

vi.mock('../../../store/pref', () => ({
  usePrefStore: (sel: (s: { lang: null }) => unknown) => sel({ lang: null }),
}));

describe('FormDate', () => {
  it('renders the label', () => {
    render(<FormDate name="start_date" label="Start Date" />);
    expect(screen.getByText('Start Date')).toBeInTheDocument();
  });

  it('renders a date picker input', () => {
    const { container } = render(<FormDate name="start_date" label="Start Date" />);
    expect(container.querySelector('input')).toBeInTheDocument();
  });

  it('renders as required when required prop given', () => {
    render(<FormDate name="start_date" label="Start Date" required />);
    // required indicator is shown
    expect(screen.getByText('Start Date')).toBeInTheDocument();
  });

  it('renders with a pre-set date', () => {
    const { container } = render(<FormDate name="start_date" label="Start Date" value="2024-06-15" />);
    expect(container.querySelector('input')).toBeInTheDocument();
  });

  it('renders disabled state', () => {
    const { container } = render(<FormDate name="start_date" label="Start Date" disabled />);
    const input = container.querySelector('input');
    expect(input).toBeDisabled();
  });
});
