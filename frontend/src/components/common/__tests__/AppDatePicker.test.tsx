import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import AppDatePicker from '../AppDatePicker';

vi.mock('../../../i18n', () => ({
  useTr: () => (k: string) => k,
  useI18n: () => ({ lang: 'en', setLang: () => {}, t: (k: string) => k }),
}));

vi.mock('../../../store/pref', () => ({
  usePrefStore: (sel: (s: { lang: null }) => unknown) => sel({ lang: null }),
}));

describe('AppDatePicker', () => {
  it('renders without crashing', () => {
    const { container } = render(<AppDatePicker />);
    expect(container).toBeInTheDocument();
  });

  it('renders with a value', () => {
    const { container } = render(<AppDatePicker value="2024-06-15" />);
    expect(container).toBeInTheDocument();
  });

  it('renders with null value', () => {
    const { container } = render(<AppDatePicker value={null} />);
    expect(container).toBeInTheDocument();
  });

  it('renders disabled state', () => {
    const { container } = render(<AppDatePicker disabled />);
    const input = container.querySelector('input');
    expect(input).toBeDisabled();
  });

  it('renders placeholder text', () => {
    const { container } = render(<AppDatePicker placeholder="Pick a date" />);
    const input = container.querySelector('input');
    expect(input).toHaveAttribute('placeholder', 'Pick a date');
  });
});
