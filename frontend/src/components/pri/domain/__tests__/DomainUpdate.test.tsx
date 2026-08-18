import { describe, it, expect, vi, beforeEach } from 'vitest';
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
      app_id: '',
      app_secret: '',
      app_alg: 'HS256',
      jaas_url: '',
      jaas_app_id: '',
      jaas_kid: '',
      jaas_key: '',
      jaas_alg: '',
      jaas_aud: '',
      jaas_iss: '',
    },
    public: true,
  }),
  action: vi.fn().mockResolvedValue({ id: 'domain-99' }),
}));

vi.mock('../../../../lib/config', () => ({
  TOKEN_ALGO: 'HS256',
}));

import { getById } from '../../../../lib/api';

describe('DomainUpdate', () => {
  beforeEach(() => {
    vi.mocked(getById).mockResolvedValue({
      id: 'domain-99',
      name: 'Updated Domain',
      auth_type: 'none',
      domain_attr: {
        url: 'https://jitsi.example.com',
        app_id: '',
        app_secret: '',
        app_alg: 'HS256',
        jaas_url: '',
        jaas_app_id: '',
        jaas_kid: '',
        jaas_key: '',
        jaas_alg: '',
        jaas_aud: '',
        jaas_iss: '',
      },
      public: true,
    });
  });

  it('renders without crashing (shows spinner initially)', () => {
    vi.mocked(getById).mockReturnValue(new Promise(() => {}));
    render(<DomainUpdate id="domain-99" />);
    expect(document.querySelector('.ant-spin')).toBeTruthy();
  });

  it('renders with cancel callback', async () => {
    const onCancel = vi.fn();
    render(<DomainUpdate id="domain-99" onCancel={onCancel} />);
    expect(await screen.findByDisplayValue('Updated Domain')).toBeInTheDocument();
  });

  it('renders with done callback', async () => {
    const onDone = vi.fn();
    render(<DomainUpdate id="domain-99" onDone={onDone} />);
    expect(await screen.findByDisplayValue('Updated Domain')).toBeInTheDocument();
  });
});
