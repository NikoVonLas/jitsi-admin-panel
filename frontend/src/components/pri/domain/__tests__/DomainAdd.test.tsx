import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import DomainAdd from '../DomainAdd';

vi.mock('../../../../i18n', () => ({
  useTr: () => (k: string) => k,
}));

vi.mock('../../../../lib/api', () => ({
  action: vi.fn().mockResolvedValue({ id: 'new-domain' }),
  getById: vi.fn().mockResolvedValue({}),
}));

vi.mock('../../../../lib/config', () => ({
  TOKEN_ALGO: 'HS256',
}));

describe('DomainAdd', () => {
  it('renders without crashing', () => {
    render(<DomainAdd />);
    expect(screen.getByText('form.name')).toBeInTheDocument();
  });

  it('renders the add button', () => {
    render(<DomainAdd />);
    expect(screen.getByText('btn.add')).toBeInTheDocument();
  });

  it('renders the cancel button', () => {
    render(<DomainAdd />);
    expect(screen.getByText('btn.cancel')).toBeInTheDocument();
  });

  it('calls onCancel when cancel is clicked', () => {
    const onCancel = vi.fn();
    render(<DomainAdd onCancel={onCancel} />);
    screen.getByText('btn.cancel').closest('button')?.click();
    expect(onCancel).toHaveBeenCalled();
  });
});
