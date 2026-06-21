import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('../../../../lib/api', () => ({
  action: vi.fn().mockResolvedValue({}),
}));

vi.mock('../../../../i18n', () => {
  const t = (k: string) => k;
  return { useTr: () => t };
});

vi.mock('../../../../store/appconfig', () => ({
  useAppConfig: vi.fn(() => ({
    config: { logo_url: '/api/pub/logo/logo', favicon_html: '' },
    setConfig: vi.fn(),
  })),
}));

vi.mock('../../../common/ImageUploadField', () => ({
  default: ({
    label,
  }: {
    label: string;
    previewUrl: string;
    onUpload: () => void;
    onReset: () => void;
  }) => (
    <div data-testid="image-upload-field">
      <span>{label}</span>
    </div>
  ),
}));

import SettingAppearance from '../SettingAppearance';

describe('SettingAppearance', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(<SettingAppearance settings={[]} />);
  });

  it('renders logo upload field', () => {
    render(<SettingAppearance settings={[]} />);
    expect(screen.getByText('form.logo')).toBeInTheDocument();
  });

  it('renders favicon upload field', () => {
    render(<SettingAppearance settings={[]} />);
    expect(screen.getByText('form.favicon')).toBeInTheDocument();
  });

  it('renders two image upload fields', () => {
    render(<SettingAppearance settings={[]} />);
    const fields = screen.getAllByTestId('image-upload-field');
    expect(fields).toHaveLength(2);
  });

  it('accepts non-empty settings prop without throwing', () => {
    render(<SettingAppearance settings={[{ mkey: 'test', mvalue: 'value' }]} />);
    expect(screen.getByText('form.logo')).toBeInTheDocument();
  });
});
