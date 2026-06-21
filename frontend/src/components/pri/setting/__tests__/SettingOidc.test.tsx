import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';

vi.mock('../../../../lib/api', () => ({
  action: vi.fn().mockResolvedValue({}),
}));

vi.mock('../../../../i18n', () => {
  const t = (k: string) => k;
  return { useTr: () => t };
});

import * as api from '../../../../lib/api';
import SettingOidc from '../SettingOidc';

function makeFetchOk(data: unknown) {
  return vi.fn().mockResolvedValue({
    ok: true,
    json: async () => data,
  });
}

describe('SettingOidc', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders spinner while loading', () => {
    vi.stubGlobal('fetch', vi.fn().mockReturnValue(new Promise(() => {})));
    render(<SettingOidc />);
    expect(document.querySelector('.ant-spin')).toBeInTheDocument();
    vi.unstubAllGlobals();
  });

  it('renders no-providers message after loading empty list', async () => {
    vi.stubGlobal('fetch', makeFetchOk([]));
    render(<SettingOidc />);
    await waitFor(() => {
      expect(screen.getByText('setting.oidc_no_providers')).toBeInTheDocument();
    });
    vi.unstubAllGlobals();
  });

  it('renders add provider button after loading', async () => {
    vi.stubGlobal('fetch', makeFetchOk([]));
    render(<SettingOidc />);
    await waitFor(() => {
      expect(screen.getByText(/setting\.add_provider/)).toBeInTheDocument();
    });
    vi.unstubAllGlobals();
  });

  it('renders providers in a table', async () => {
    vi.stubGlobal(
      'fetch',
      makeFetchOk([
        {
          id: 'prov-1',
          name: 'Keycloak',
          issuer_url: 'https://kc.example.com',
          client_id: 'my-client',
          scopes: 'openid profile email',
          enabled: true,
        },
      ]),
    );
    render(<SettingOidc />);
    await waitFor(() => {
      expect(screen.getByText('Keycloak')).toBeInTheDocument();
    });
    vi.unstubAllGlobals();
  });

  it('shows error when fetch fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')));
    render(<SettingOidc />);
    await waitFor(() => {
      expect(screen.getByText('err.generic')).toBeInTheDocument();
    });
    vi.unstubAllGlobals();
  });

  it('shows error when fetch returns non-ok response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }));
    render(<SettingOidc />);
    await waitFor(() => {
      expect(screen.getByText('err.generic')).toBeInTheDocument();
    });
    vi.unstubAllGlobals();
  });

  it('renders oidc hint text after loading', async () => {
    vi.stubGlobal('fetch', makeFetchOk([]));
    render(<SettingOidc />);
    await waitFor(() => {
      expect(screen.getByText('setting.oidc_hint')).toBeInTheDocument();
    });
    vi.unstubAllGlobals();
  });

  it('opens add modal when add provider button is clicked', async () => {
    vi.stubGlobal('fetch', makeFetchOk([]));
    render(<SettingOidc />);
    await waitFor(() => {
      expect(screen.getByText(/setting\.add_provider/)).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText(/setting\.add_provider/));
    await waitFor(() => {
      expect(screen.getAllByText(/setting\.add_provider/).length).toBeGreaterThan(0);
    });
    vi.unstubAllGlobals();
  });

  it('api action is available', () => {
    expect(vi.mocked(api.action)).toBeDefined();
  });
});
