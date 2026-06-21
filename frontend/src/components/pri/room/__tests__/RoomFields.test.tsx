import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import RoomFields from '../RoomFields';

vi.mock('../../../../i18n', () => ({
  useTr: () => (k: string) => k,
}));

vi.mock('../../../../lib/api', () => ({
  list: vi.fn().mockResolvedValue({ items: [] }),
}));

vi.mock('../../../common/FormSelect', () => ({
  default: ({ label, value }: { label: string; value?: string }) => (
    <div>
      <label>{label}</label>
      <select defaultValue={value ?? ''} aria-label={label} />
    </div>
  ),
}));

const defaultProps = {
  label: '',
  onLabelChange: vi.fn(),
  slug: '',
  onSlugChange: vi.fn(),
  domainId: '',
  onDomainIdChange: vi.fn(),
};

describe('RoomFields', () => {
  it('renders label field', () => {
    render(<RoomFields {...defaultProps} />);
    expect(screen.getByText('form.label')).toBeInTheDocument();
  });

  it('renders slug field', () => {
    render(<RoomFields {...defaultProps} />);
    expect(screen.getByText('form.slug')).toBeInTheDocument();
  });

  it('renders domain field when hideDomain is false', () => {
    render(<RoomFields {...defaultProps} />);
    expect(screen.getByText('form.domain')).toBeInTheDocument();
  });

  it('hides domain field when hideDomain is true', () => {
    render(<RoomFields {...defaultProps} hideDomain />);
    expect(screen.queryByText('form.domain')).toBeNull();
  });

  it('renders slug input with provided value', () => {
    render(<RoomFields {...defaultProps} slug="my-room-slug" />);
    expect(screen.getByDisplayValue('my-room-slug')).toBeInTheDocument();
  });

  it('renders disabled state', () => {
    render(<RoomFields {...defaultProps} disabled />);
    const inputs = document.querySelectorAll('input');
    const disabledInputs = Array.from(inputs).filter((i) => i.disabled);
    expect(disabledInputs.length).toBeGreaterThan(0);
  });
});
