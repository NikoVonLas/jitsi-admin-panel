import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import ProfileAddPage from '../ProfileAddPage';

vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
}));

vi.mock('../../../../i18n', () => ({
  useTr: () => (key: string) => key,
}));

vi.mock('../../../../components/common/SubheaderCenter', () => ({
  default: ({ title }: { title: string }) => <div data-testid="subheader-center">{title}</div>,
}));

vi.mock('../../../../components/pri/profile/ProfileAdd', () => ({
  default: () => <div data-testid="profile-add">ProfileAdd</div>,
}));

describe('ProfileAddPage', () => {
  it('renders without crashing', () => {
    render(<ProfileAddPage />);
  });

  it('renders profile add form', () => {
    render(<ProfileAddPage />);
    expect(screen.getByTestId('profile-add')).toBeInTheDocument();
  });

  it('renders subheader with add profile title', () => {
    render(<ProfileAddPage />);
    expect(screen.getByText('page.add_profile')).toBeInTheDocument();
  });
});
