import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import FilterUser from '../FilterUser';

vi.mock('../../../i18n', () => ({
  useTr: () => (k: string) => k,
}));

vi.mock('../../../lib/api', () => ({
  listByValue: vi.fn().mockResolvedValue([]),
}));

describe('FilterUser', () => {
  it('renders an input', () => {
    render(<FilterUser value="" onChange={vi.fn()} />);
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('shows placeholder from i18n key', () => {
    render(<FilterUser value="" onChange={vi.fn()} />);
    expect(screen.getByPlaceholderText('filter.user_placeholder')).toBeInTheDocument();
  });

  it('calls onChange with empty string when input cleared', () => {
    const onChange = vi.fn();
    render(<FilterUser value="something" onChange={onChange} />);
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: '' } });
    expect(onChange).toHaveBeenCalledWith('');
  });

  it('reflects initial value in input', () => {
    render(<FilterUser value="test@example.com" onChange={vi.fn()} />);
    expect(screen.getByDisplayValue('test@example.com')).toBeInTheDocument();
  });

  it('does not crash when onChange is called with empty value', () => {
    const onChange = vi.fn();
    render(<FilterUser value="foo" onChange={onChange} />);
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: '' } });
    expect(onChange).toHaveBeenCalledWith('');
  });
});
