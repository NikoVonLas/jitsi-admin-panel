import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import JoinByCodePage from '../JoinByCodePage';

vi.mock('../../FetchAndRedirectPage', () => ({
  default: ({ endpoint }: { endpoint: string }) => (
    <div data-testid="fetch-redirect" data-endpoint={endpoint}>loading</div>
  ),
}));

describe('JoinByCodePage', () => {
  it('renders without crashing', () => {
    render(<JoinByCodePage />);
  });

  it('renders FetchAndRedirectPage', () => {
    render(<JoinByCodePage />);
    expect(screen.getByTestId('fetch-redirect')).toBeInTheDocument();
  });

  it('passes correct endpoint to FetchAndRedirectPage', () => {
    render(<JoinByCodePage />);
    expect(screen.getByTestId('fetch-redirect')).toHaveAttribute(
      'data-endpoint',
      '/api/pub/meeting/get/link/byshortcode'
    );
  });
});
