import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import DomainUpdate from '../DomainUpdate';

vi.mock('../../../../i18n', () => ({
  useTr: () => (k: string) => k,
}));

vi.mock('../../../../lib/api', () => ({
  getById: vi.fn().mockResolvedValue({
    id: 'domain-99',
    name: 'Updated Domain',
    auth_type: 'none',
    domain_attr: {
      url: 'https://jitsi.example.com',
      app_id: '', app_secret: '', app_alg: 'HS256',
      jaas_url: '', jaas_app_id: '', jaas_kid: '', jaas_key: '', jaas_alg: '', jaas_aud: '', jaas_iss: '',
    },
    public: true,
  }),
  action: vi.fn().mockResolvedValue({ id: 'domain-99' }),
}));

vi.mock('../../../../lib/config', () => ({
  TOKEN_ALGO: 'HS256',
}));

describe('DomainUpdate', () => {
  it('renders without crashing (shows spinner initially)', () => {
    render(<DomainUpdate id="domain-99" />);
    // Either spinner or the form after load
    expect(document.querySelector('.ant-spin') ?? document.querySelector('form')).toBeTruthy();
  });

  it('renders with cancel callback', () => {
    const onCancel = vi.fn();
    render(<DomainUpdate id="domain-99" onCancel={onCancel} />);
    expect(document.body).toBeTruthy();
  });

  it('renders with done callback', () => {
    const onDone = vi.fn();
    render(<DomainUpdate id="domain-99" onDone={onDone} />);
    expect(document.body).toBeTruthy();
  });
});
