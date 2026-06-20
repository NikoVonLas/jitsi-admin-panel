import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FormSwitch from '../../common/FormSwitch';

describe('FormSwitch', () => {
  it('renders a switch', () => {
    render(<FormSwitch label="Enable" />);
    expect(screen.getByRole('switch')).toBeInTheDocument();
  });

  it('renders label text', () => {
    render(<FormSwitch label="Feature toggle" />);
    expect(screen.getByText('Feature toggle')).toBeInTheDocument();
  });

  it('renders checked when checked=true', () => {
    render(<FormSwitch label="On" checked />);
    expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'true');
  });

  it('renders unchecked when checked=false', () => {
    render(<FormSwitch label="Off" checked={false} />);
    expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'false');
  });

  it('calls onChange when toggled', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<FormSwitch label="Toggle" checked={false} onChange={onChange} />);
    await user.click(screen.getByRole('switch'));
    expect(onChange).toHaveBeenCalled();
  });

  it('renders hint when provided', () => {
    render(<FormSwitch label="Label" hint="Some helpful hint" />);
    expect(screen.getByText('Some helpful hint')).toBeInTheDocument();
  });

  it('renders disabled', () => {
    render(<FormSwitch label="Disabled" disabled />);
    expect(screen.getByRole('switch')).toBeDisabled();
  });
});
