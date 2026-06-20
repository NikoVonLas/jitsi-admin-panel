import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import AlertWarning from '../../common/AlertWarning';

describe('AlertWarning', () => {
  it('renders children text', () => {
    render(<AlertWarning>Something went wrong</AlertWarning>);
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('renders with default warning type', () => {
    const { container } = render(<AlertWarning>Warning</AlertWarning>);
    expect(container.firstChild).not.toBeNull();
  });

  it('renders with error type', () => {
    render(<AlertWarning type="error">Error message</AlertWarning>);
    expect(screen.getByText('Error message')).toBeInTheDocument();
  });

  it('renders with info type', () => {
    render(<AlertWarning type="info">Info message</AlertWarning>);
    expect(screen.getByText('Info message')).toBeInTheDocument();
  });

  it('renders with success type', () => {
    render(<AlertWarning type="success">Success!</AlertWarning>);
    expect(screen.getByText('Success!')).toBeInTheDocument();
  });

  it('renders React node children', () => {
    render(
      <AlertWarning>
        <span data-testid="child">Node child</span>
      </AlertWarning>,
    );
    expect(screen.getByTestId('child')).toBeInTheDocument();
  });
});
