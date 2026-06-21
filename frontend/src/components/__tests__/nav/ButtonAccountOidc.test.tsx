import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ButtonAccountOidc from '../../nav/ButtonAccountOidc';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

vi.mock('../../../i18n', () => ({
  useTr: () => (key: string) => key,
}));

vi.mock('../../../lib/api', () => ({
  get: vi.fn().mockResolvedValue({ id: 'p1', name: 'John Doe', email: 'john@example.com' }),
}));

vi.mock('../../../store/pref', () => ({
  usePrefStore: () => ({
    lang: 'en',
    theme: 'system',
    setLang: vi.fn().mockResolvedValue(undefined),
    setTheme: vi.fn().mockResolvedValue(undefined),
  }),
}));

vi.mock('../../../components/pri/profile/ProfileUpdate', () => ({
  default: ({ profile }: { profile: { name: string } }) => (
    <div data-testid="profile-update">{profile.name}</div>
  ),
}));

import { get } from '../../../lib/api';

describe('ButtonAccountOidc', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockClear();
    vi.mocked(get).mockResolvedValue({ id: 'p1', name: 'John Doe', email: 'john@example.com' });
  });

  it('renders without crashing', async () => {
    render(<ButtonAccountOidc />);
    await waitFor(() => {});
  });

  it('renders account button', () => {
    render(<ButtonAccountOidc />);
    const button = document.querySelector('button');
    expect(button).toBeInTheDocument();
  });

  it('shows profile first name after loading', async () => {
    render(<ButtonAccountOidc />);
    await waitFor(() => expect(screen.getByText('John')).toBeInTheDocument());
  });

  it('opens drawer on button click', async () => {
    render(<ButtonAccountOidc />);
    await waitFor(() => expect(screen.getByText('John')).toBeInTheDocument());
    const button = document.querySelector('button')!;
    fireEvent.click(button);
    await waitFor(() => expect(screen.getByText('nav.account')).toBeInTheDocument());
  });

  it('shows theme options in drawer', async () => {
    render(<ButtonAccountOidc />);
    await waitFor(() => screen.getByText('John'));
    fireEvent.click(document.querySelector('button')!);
    await waitFor(() => expect(screen.getByText('pref.appearance')).toBeInTheDocument());
  });

  it('shows language options in drawer', async () => {
    render(<ButtonAccountOidc />);
    await waitFor(() => screen.getByText('John'));
    fireEvent.click(document.querySelector('button')!);
    await waitFor(() => expect(screen.getByText('pref.language')).toBeInTheDocument());
  });

  it('navigates to /oidc/logout on logout click', async () => {
    render(<ButtonAccountOidc />);
    await waitFor(() => screen.getByText('John'));
    fireEvent.click(document.querySelector('button')!);
    await waitFor(() => screen.getByText('nav.logout'));
    fireEvent.click(screen.getByText('nav.logout'));
    expect(mockNavigate).toHaveBeenCalledWith('/oidc/logout');
  });

  it('does not show first name when profile name is empty', async () => {
    vi.mocked(get).mockResolvedValue({ id: 'p1', name: '', email: 'test@example.com' });
    render(<ButtonAccountOidc />);
    await waitFor(() => {});
    const button = document.querySelector('button')!;
    expect(button.textContent?.trim()).toBe('');
  });
});
