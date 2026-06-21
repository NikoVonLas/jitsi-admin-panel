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
import SettingGeneral from '../SettingGeneral';

describe('SettingGeneral', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(<SettingGeneral settings={[]} />);
  });

  it('renders contact email field', () => {
    render(<SettingGeneral settings={[]} />);
    expect(screen.getByText('form.contact_email')).toBeInTheDocument();
  });

  it('renders galaxy FQDN field', () => {
    render(<SettingGeneral settings={[]} />);
    expect(screen.getByText('form.galaxy_fqdn')).toBeInTheDocument();
  });

  it('renders galaxy scheme field', () => {
    render(<SettingGeneral settings={[]} />);
    expect(screen.getByText('form.galaxy_scheme')).toBeInTheDocument();
  });

  it('renders week start field', () => {
    render(<SettingGeneral settings={[]} />);
    expect(screen.getByText('form.week_start')).toBeInTheDocument();
  });

  it('renders submit button', () => {
    render(<SettingGeneral settings={[]} />);
    expect(screen.getByText('btn.submit')).toBeInTheDocument();
  });

  it('initialises fields from settings prop', () => {
    const settings = [
      { mkey: 'contact_email', mvalue: 'admin@example.com' },
      { mkey: 'galaxy_fqdn', mvalue: 'meet.example.com' },
    ];
    render(<SettingGeneral settings={settings} />);
    const emailInput = document.querySelector('input[name="contact_email"]') as HTMLInputElement;
    expect(emailInput?.value).toBe('admin@example.com');
  });

  it('calls API action when form is submitted', async () => {
    render(<SettingGeneral settings={[]} />);
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
    render(<SettingGeneral settings={[]} />);
    const form = document.querySelector('form');
    if (form) fireEvent.submit(form);
    await waitFor(() => {
      expect(screen.getByText('err.update')).toBeInTheDocument();
    });
  });
});
