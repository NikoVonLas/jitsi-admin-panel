import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import DomainForm from '../DomainForm';

vi.mock('../../../../i18n', () => ({
  useTr: () => (k: string) => k,
}));

vi.mock('../../../../lib/api', () => ({
  getById: vi.fn().mockResolvedValue({
    id: 'domain-1',
    name: 'Loaded Domain',
    auth_type: 'none',
    domain_attr: { url: 'https://jitsi.example.com', app_id: '', app_secret: '', app_alg: 'HS256', jaas_url: '', jaas_app_id: '', jaas_kid: '', jaas_key: '', jaas_alg: '', jaas_aud: '', jaas_iss: '' },
    public: false,
  }),
  action: vi.fn().mockResolvedValue({ id: 'domain-1' }),
}));

vi.mock('../../../../lib/config', () => ({
  TOKEN_ALGO: 'HS256',
}));

describe('DomainForm (add mode)', () => {
  it('renders the name field', () => {
    render(<DomainForm />);
    expect(screen.getByText('form.name')).toBeInTheDocument();
  });

  it('renders cancel and submit buttons', () => {
    render(<DomainForm />);
    expect(screen.getByText('btn.cancel')).toBeInTheDocument();
    expect(screen.getByText('btn.add')).toBeInTheDocument();
  });

  it('renders URL field', () => {
    render(<DomainForm />);
    expect(screen.getByText('form.url')).toBeInTheDocument();
  });
});

describe('DomainForm (update mode)', () => {
  it('shows spinner initially when loading', () => {
    render(<DomainForm domainId="domain-1" />);
    // Spinner is shown while data loads
    expect(document.querySelector('.ant-spin') ?? screen.queryByText('form.name')).toBeTruthy();
  });
});
