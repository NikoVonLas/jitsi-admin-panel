import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';

vi.mock('../../../../lib/api', () => ({
  list: vi.fn().mockResolvedValue([]),
  action: vi.fn().mockResolvedValue({}),
}));

vi.mock('../../../../i18n', () => {
  const t = (k: string) => k;
  return { useTr: () => t };
});

import * as api from '../../../../lib/api';
import SettingAuth from '../SettingAuth';

interface OidcProvider {
  id: string;
  name: string;
  issuer_url: string;
  client_id: string;
  scopes: string;
  enabled: boolean;
}

function makeProvider(overrides: Partial<OidcProvider> = {}): OidcProvider {
  return {
    id: 'prov-1',
    name: 'Keycloak',
    issuer_url: 'https://kc.example.com/realms/test',
    client_id: 'my-client',
    scopes: 'openid profile email',
    enabled: true,
    ...overrides,
  };
}

describe('SettingAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(api.list).mockResolvedValue([]);
  });

  it('renders spinner while loading', () => {
    vi.mocked(api.list).mockReturnValue(new Promise(() => {}));
    render(<SettingAuth />);
    expect(document.querySelector('.ant-spin')).toBeInTheDocument();
  });

  it('renders empty state after loading empty list', async () => {
    vi.mocked(api.list).mockResolvedValue([]);
    render(<SettingAuth />);
    await waitFor(() => {
      expect(
        screen.getByText(/setting\.oidc_no_providers|No SSO providers configured/),
      ).toBeInTheDocument();
    });
  });

  it('renders providers after loading', async () => {
    vi.mocked(api.list).mockResolvedValue([makeProvider()]);
    render(<SettingAuth />);
    await waitFor(() => {
      expect(screen.getByText('Keycloak')).toBeInTheDocument();
    });
  });

  it('renders provider issuer URL', async () => {
    vi.mocked(api.list).mockResolvedValue([makeProvider()]);
    render(<SettingAuth />);
    await waitFor(() => {
      expect(screen.getByText('https://kc.example.com/realms/test')).toBeInTheDocument();
    });
  });

  it('renders provider client ID', async () => {
    vi.mocked(api.list).mockResolvedValue([makeProvider()]);
    render(<SettingAuth />);
    await waitFor(() => {
      expect(screen.getByText(/my-client/)).toBeInTheDocument();
    });
  });

  it('renders without crashing when addOpen is true', async () => {
    render(<SettingAuth addOpen={true} />);
    // Spinner shows while loading
    expect(document.querySelector('.ant-spin')).toBeInTheDocument();
    // After loading completes, spinner disappears
    await waitFor(() => {
      expect(document.querySelector('.ant-spin')).not.toBeInTheDocument();
    });
  });

  it('shows error when API fails', async () => {
    vi.mocked(api.list).mockRejectedValue(new Error('API error'));
    render(<SettingAuth />);
    await waitFor(() => {
      expect(screen.getByText('err.generic')).toBeInTheDocument();
    });
  });

  it('accepts onAddClose prop without crashing', async () => {
    const onAddClose = vi.fn();
    render(<SettingAuth addOpen={true} onAddClose={onAddClose} />);
    await waitFor(() => {
      expect(document.querySelector('.ant-spin')).not.toBeInTheDocument();
    });
    // onAddClose is a valid callback - not yet called on initial render
    expect(onAddClose).not.toHaveBeenCalled();
  });

  it('handles list response with items property', async () => {
    vi.mocked(api.list).mockResolvedValue({ items: [makeProvider({ name: 'TestSSO' })] });
    render(<SettingAuth />);
    await waitFor(() => {
      expect(screen.getByText('TestSSO')).toBeInTheDocument();
    });
  });

  it('calls list API on mount', async () => {
    render(<SettingAuth />);
    await waitFor(() => {
      expect(vi.mocked(api.list)).toHaveBeenCalledWith('/api/pri/oidc-provider/list', 100);
    });
  });
});
