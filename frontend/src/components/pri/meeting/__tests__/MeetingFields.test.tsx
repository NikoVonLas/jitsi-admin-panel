import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import MeetingFields from '../MeetingFields';

vi.mock('../../../../i18n', () => ({
  useTr: () => (k: string) => k,
}));

vi.mock('../../../common/FormSelect', () => ({
  default: ({ label, value, options }: { label: string; value?: string; options: [string, string][] }) => (
    <div>
      <label>{label}</label>
      <select defaultValue={value ?? ''}>
        {(options ?? []).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
    </div>
  ),
}));

const defaultProps = {
  name: '',
  onNameChange: vi.fn(),
  info: '',
  onInfoChange: vi.fn(),
  roomId: '',
  onRoomIdChange: vi.fn(),
  rooms: [] as [string, string][],
};

describe('MeetingFields', () => {
  it('renders the name field', () => {
    render(<MeetingFields {...defaultProps} />);
    expect(screen.getByText('form.name')).toBeInTheDocument();
  });

  it('renders the info field', () => {
    render(<MeetingFields {...defaultProps} />);
    expect(screen.getByText('form.info')).toBeInTheDocument();
  });

  it('renders the room selector', () => {
    render(<MeetingFields {...defaultProps} />);
    expect(screen.getByText('form.room')).toBeInTheDocument();
  });

  it('renders with pre-filled name value', () => {
    render(<MeetingFields {...defaultProps} name="Weekly Standup" />);
    expect(screen.getByDisplayValue('Weekly Standup')).toBeInTheDocument();
  });

  it('renders room options', () => {
    render(
      <MeetingFields
        {...defaultProps}
        rooms={[['r1', 'Room One'], ['r2', 'Room Two']]}
        roomId="r1"
      />,
    );
    expect(screen.getByText('Room One')).toBeInTheDocument();
  });

  it('renders disabled state', () => {
    render(<MeetingFields {...defaultProps} disabled />);
    const inputs = document.querySelectorAll('input');
    const disabledInputs = Array.from(inputs).filter((i) => i.disabled);
    expect(disabledInputs.length).toBeGreaterThan(0);
  });
});
