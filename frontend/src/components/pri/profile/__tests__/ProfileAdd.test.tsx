import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import ProfileAdd from '../ProfileAdd';

vi.mock('../../../../i18n', () => ({
  useTr: () => (k: string) => k,
}));

vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
}));

vi.mock('../../../../lib/api', () => ({
  action: vi.fn().mockResolvedValue({ id: 'new-profile' }),
}));

describe('ProfileAdd', () => {
  it('renders name field', () => {
    render(<ProfileAdd />);
    expect(screen.getByText('form.name')).toBeInTheDocument();
  });

  it('renders email field', () => {
    render(<ProfileAdd />);
    expect(screen.getByText('form.email_optional')).toBeInTheDocument();
  });

  it('renders add button', () => {
    render(<ProfileAdd />);
    expect(screen.getByText('btn.add')).toBeInTheDocument();
  });

  it('renders cancel button', () => {
    render(<ProfileAdd />);
    expect(screen.getByText('btn.cancel')).toBeInTheDocument();
  });
});
