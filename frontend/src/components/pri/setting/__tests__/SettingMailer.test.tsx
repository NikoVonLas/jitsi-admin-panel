import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

vi.mock('../../../../lib/api', () => ({
  action: vi.fn().mockResolvedValue({}),
}));

vi.mock('../../../../i18n', () => {
  const t = (k: string) => k;
  return { useTr: () => t };
});

import * as api from '../../../../lib/api';
import SettingMailer from '../SettingMailer';

describe('SettingMailer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(<SettingMailer settings={[]} />);
  });

  it('renders mailer host field', () => {
    render(<SettingMailer settings={[]} />);
    expect(screen.getByText('form.mailer_host')).toBeInTheDocument();
  });

  it('renders mailer port field', () => {
    render(<SettingMailer settings={[]} />);
    expect(screen.getByText('form.mailer_port')).toBeInTheDocument();
  });

  it('renders mailer secure switch', () => {
    render(<SettingMailer settings={[]} />);
    expect(screen.getByText('form.mailer_secure')).toBeInTheDocument();
  });

  it('renders mailer user field', () => {
    render(<SettingMailer settings={[]} />);
    expect(screen.getByText('form.mailer_user')).toBeInTheDocument();
  });

  it('renders mailer password field', () => {
    render(<SettingMailer settings={[]} />);
    expect(screen.getByText('form.mailer_pass')).toBeInTheDocument();
  });

  it('renders mailer from field', () => {
    render(<SettingMailer settings={[]} />);
    expect(screen.getByText('form.mailer_from')).toBeInTheDocument();
  });

  it('renders submit button', () => {
    render(<SettingMailer settings={[]} />);
    expect(screen.getByText('btn.submit')).toBeInTheDocument();
  });

  it('initialises fields from settings prop', () => {
    const settings = [
      { mkey: 'mailer_host', mvalue: 'smtp.example.com' },
      { mkey: 'mailer_port', mvalue: '587' },
    ];
    render(<SettingMailer settings={settings} />);
    const hostInput = document.querySelector('input[name="mailer_host"]') as HTMLInputElement;
    expect(hostInput?.value).toBe('smtp.example.com');
  });

  it('initialises mailer_secure from settings prop as false', () => {
    const settings = [{ mkey: 'mailer_secure', mvalue: 'false' }];
    render(<SettingMailer settings={settings} />);
    const switchEl = document.querySelector('.ant-switch');
    expect(switchEl).toBeInTheDocument();
    expect(switchEl).not.toHaveClass('ant-switch-checked');
  });

  it('defaults mailer_secure to true (checked) when not in settings', () => {
    render(<SettingMailer settings={[]} />);
    const switchEl = document.querySelector('.ant-switch');
    expect(switchEl).toBeInTheDocument();
    expect(switchEl).toHaveClass('ant-switch-checked');
  });

  it('calls API action when form is submitted', async () => {
    render(<SettingMailer settings={[]} />);
    const form = document.querySelector('form');
    if (form) fireEvent.submit(form);
    await waitFor(() => {
      expect(vi.mocked(api.action)).toHaveBeenCalledWith(
        '/api/pri/setting/update',
        expect.any(Object),
      );
    });
  });

  it('shows error warning when API call fails', async () => {
    vi.mocked(api.action).mockRejectedValue(new Error('Server error'));
    render(<SettingMailer settings={[]} />);
    const form = document.querySelector('form');
    if (form) fireEvent.submit(form);
    await waitFor(() => {
      expect(screen.getByText('err.update')).toBeInTheDocument();
    });
  });

  it('renders secret hint for password field', () => {
    render(<SettingMailer settings={[]} />);
    expect(screen.getByText('form.secret_hint')).toBeInTheDocument();
  });
});
