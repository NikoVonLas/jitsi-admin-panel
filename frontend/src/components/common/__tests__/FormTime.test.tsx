import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import FormTime from '../FormTime';

vi.mock('../../../i18n', () => ({
  useTr: () => (k: string) => k,
  useI18n: () => ({ lang: 'en', setLang: () => {}, t: (k: string) => k }),
}));

vi.mock('../../../store/pref', () => ({
  usePrefStore: (sel: (s: { lang: null }) => unknown) => sel({ lang: null }),
}));

describe('FormTime', () => {
  it('renders the label', () => {
    render(<FormTime name="meeting_time" label="Meeting Time" />);
    expect(screen.getByText('Meeting Time')).toBeInTheDocument();
  });

  it('renders a time picker input', () => {
    const { container } = render(<FormTime name="meeting_time" label="Meeting Time" />);
    expect(container.querySelector('input')).toBeInTheDocument();
  });

  it('renders with a pre-set time', () => {
    const { container } = render(<FormTime name="meeting_time" label="Meeting Time" value="14:30" />);
    expect(container.querySelector('input')).toBeInTheDocument();
  });

  it('renders disabled state', () => {
    const { container } = render(<FormTime name="meeting_time" label="Meeting Time" disabled />);
    const input = container.querySelector('input');
    expect(input).toBeDisabled();
  });

  it('renders as required when required prop given', () => {
    render(<FormTime name="meeting_time" label="Meeting Time" required />);
    expect(screen.getByText('Meeting Time')).toBeInTheDocument();
  });
});
