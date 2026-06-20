import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Spinner from '../../common/Spinner';

describe('Spinner', () => {
  it('renders without children', () => {
    const { container } = render(<Spinner />);
    expect(container.firstChild).not.toBeNull();
  });

  it('renders children text when provided', () => {
    render(<Spinner>Loading data...</Spinner>);
    expect(screen.getByText('Loading data...')).toBeInTheDocument();
  });

  it('does not render children span when no children', () => {
    const { queryByText } = render(<Spinner />);
    expect(queryByText('Loading data...')).not.toBeInTheDocument();
  });
});
