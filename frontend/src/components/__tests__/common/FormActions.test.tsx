import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import FormActions from '../../common/FormActions';

describe('FormActions', () => {
  it('renders a single child', () => {
    render(
      <FormActions>
        <button>Submit</button>
      </FormActions>,
    );
    expect(screen.getByRole('button', { name: 'Submit' })).toBeInTheDocument();
  });

  it('renders multiple children side by side', () => {
    render(
      <FormActions>
        <button>Cancel</button>
        <button>Save</button>
      </FormActions>,
    );
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
  });

  it('renders children inside flex wrappers', () => {
    const { container } = render(
      <FormActions>
        <button>A</button>
        <button>B</button>
      </FormActions>,
    );
    const wrappers = container.querySelectorAll('[style*="flex: 1"]');
    expect(wrappers.length).toBe(2);
  });
});
