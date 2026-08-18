import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

vi.mock('../../../../i18n', () => {
  const t = (key: string) => key;
  return { useTr: () => t };
});

import SettingAuth from '../SettingAuth';
import SettingUsers from '../SettingUsers';

function response(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('settings CRUD forms', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('submits the local user form through the real API client and reloads the list', async () => {
    const onAddClose = vi.fn();
    const newUser = {
      id: 'user-2',
      email: 'alice@example.com',
      is_superadmin: false,
      created_at: '2026-01-02T00:00:00.000Z',
    };
    const fetchMock = vi.mocked(fetch);
    fetchMock
      .mockResolvedValueOnce(response([]))
      .mockResolvedValueOnce(response([{ id: newUser.id }]))
      .mockResolvedValueOnce(response([newUser]));

    const user = userEvent.setup();
    render(<SettingUsers addOpen onAddClose={onAddClose} />);

    await user.type(screen.getByLabelText('user.email'), newUser.email);
    await user.type(screen.getByLabelText('user.name'), 'Alice');
    await user.type(screen.getByLabelText('user.password'), 'correct-horse-battery-staple');
    await user.click(screen.getByRole('button', { name: 'user.add' }));

    await waitFor(() => expect(onAddClose).toHaveBeenCalledOnce());
    expect(await screen.findByText(newUser.email)).toBeInTheDocument();
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      '/api/pri/user/add',
      expect.objectContaining({
        method: 'post',
        body: JSON.stringify({
          email: newUser.email,
          password: 'correct-horse-battery-staple',
          name: 'Alice',
          is_superadmin: false,
        }),
      })
    );
  });

  it('submits the OIDC provider form through the real API client and reloads the list', async () => {
    const onAddClose = vi.fn();
    const provider = {
      id: 'provider-1',
      name: 'Keycloak',
      issuer_url: 'https://keycloak.example.com/realms/jitsi',
      client_id: 'jitsi-admin',
      scopes: 'openid profile email',
      enabled: true,
    };
    const fetchMock = vi.mocked(fetch);
    fetchMock
      .mockResolvedValueOnce(response([]))
      .mockResolvedValueOnce(response([{ id: provider.id }]))
      .mockResolvedValueOnce(response([provider]));

    const user = userEvent.setup();
    render(<SettingAuth addOpen onAddClose={onAddClose} />);

    await screen.findByLabelText('form.oidc_issuer_url');
    const nameInput = screen.getByLabelText('setting.provider_name');
    await user.clear(nameInput);
    await user.type(nameInput, provider.name);
    await user.type(screen.getByLabelText('form.oidc_issuer_url'), provider.issuer_url);
    await user.type(screen.getByLabelText('form.oidc_client_id'), provider.client_id);
    await user.type(screen.getByLabelText('form.oidc_client_secret'), 'client-secret');
    await user.click(screen.getByRole('button', { name: 'btn.add' }));

    await waitFor(() => expect(onAddClose).toHaveBeenCalledOnce());
    expect(await screen.findByText(provider.name)).toBeInTheDocument();
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      '/api/pri/oidc-provider/add',
      expect.objectContaining({
        method: 'post',
        body: JSON.stringify({
          name: provider.name,
          issuer_url: provider.issuer_url,
          client_id: provider.client_id,
          client_secret: 'client-secret',
          scopes: provider.scopes,
        }),
      })
    );
  });

  it('toggles and deletes an OIDC provider using mutation response rows', async () => {
    const provider = {
      id: 'provider-1',
      name: 'Keycloak',
      issuer_url: 'https://keycloak.example.com/realms/jitsi',
      client_id: 'jitsi-admin',
      scopes: 'openid profile email',
      enabled: true,
    };
    const fetchMock = vi.mocked(fetch);
    fetchMock
      .mockResolvedValueOnce(response([provider]))
      .mockResolvedValueOnce(response([{ ok: true }]))
      .mockResolvedValueOnce(response([{ ok: true }]))
      .mockResolvedValueOnce(response([]));

    const user = userEvent.setup();
    render(<SettingAuth />);

    expect(await screen.findByText(provider.name)).toBeInTheDocument();
    await user.click(screen.getByRole('switch'));
    await waitFor(() =>
      expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'false')
    );

    fireEvent.click(document.querySelector('.ant-btn-dangerous') as HTMLElement);
    await user.click(await screen.findByRole('button', { name: 'btn.delete' }));

    expect(await screen.findByText('setting.oidc_no_providers')).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(4);
  });
});
