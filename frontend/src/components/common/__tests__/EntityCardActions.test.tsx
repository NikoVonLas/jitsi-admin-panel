import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { entityCardActions } from '../EntityCardActions';

const t = (k: string) => k;

describe('entityCardActions', () => {
  function renderActions(props: Parameters<typeof entityCardActions>[0]) {
    const actions = entityCardActions(props);
    return render(<div>{actions}</div>);
  }

  it('renders toggle and delete actions', () => {
    renderActions({
      enabled: true,
      toggleLoading: false,
      delLoading: false,
      toggleTitle: 'Disable?',
      delTitle: 'Delete?',
      delDescription: 'This will delete.',
      onToggle: vi.fn(),
      onDel: vi.fn(),
      t,
    });
    // Two popconfirm trigger buttons should be present
    expect(document.querySelectorAll('button').length).toBeGreaterThanOrEqual(2);
  });

  it('returns extra actions at the start', () => {
    const extra = <button key="extra">Extra</button>;
    const actions = entityCardActions({
      enabled: false,
      toggleLoading: false,
      delLoading: false,
      toggleTitle: 'Enable?',
      delTitle: 'Delete?',
      delDescription: 'Really?',
      onToggle: vi.fn(),
      onDel: vi.fn(),
      t,
      extraActions: [extra],
    });
    render(<div>{actions}</div>);
    expect(screen.getByText('Extra')).toBeInTheDocument();
  });

  it('returns 2 actions when no extras provided', () => {
    const actions = entityCardActions({
      enabled: true,
      toggleLoading: false,
      delLoading: false,
      toggleTitle: 'Disable?',
      delTitle: 'Delete?',
      delDescription: 'Sure?',
      onToggle: vi.fn(),
      onDel: vi.fn(),
      t,
    });
    expect(actions).toHaveLength(2);
  });

  it('returns 3 actions when 1 extra provided', () => {
    const actions = entityCardActions({
      enabled: true,
      toggleLoading: false,
      delLoading: false,
      toggleTitle: 'Disable?',
      delTitle: 'Delete?',
      delDescription: 'Sure?',
      onToggle: vi.fn(),
      onDel: vi.fn(),
      t,
      extraActions: [<button key="x">X</button>],
    });
    expect(actions).toHaveLength(3);
  });
});
