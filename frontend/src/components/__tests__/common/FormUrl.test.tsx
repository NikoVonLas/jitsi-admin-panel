import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import FormUrl from '../../common/FormUrl';

describe('FormUrl (uncontrolled mode)', () => {
  it('renders an input', () => {
    render(<FormUrl name="url" label="URL" />);
    // antd renders an input
    const input = document.querySelector('input');
    expect(input).not.toBeNull();
  });

  it('renders the label', () => {
    render(<FormUrl name="url" label="Webhook URL" />);
    expect(screen.getByText('Webhook URL')).toBeInTheDocument();
  });

  it('shows current value', () => {
    render(<FormUrl name="url" label="URL" value="https://example.com" />);
    expect(
      screen.getByDisplayValue('https://example.com'),
    ).toBeInTheDocument();
  });

  it('calls onChange', () => {
    const onChange = vi.fn();
    render(<FormUrl name="url" label="URL" value="" onChange={onChange} />);
    fireEvent.change(document.querySelector('input')!, {
      target: { value: 'https://new.com' },
    });
    expect(onChange).toHaveBeenCalledWith('https://new.com');
  });

  it('renders disabled', () => {
    render(<FormUrl name="url" label="URL" disabled />);
    expect(document.querySelector('input')).toBeDisabled();
  });
});
