import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import RoomByCodePage from '../RoomByCodePage';

vi.mock('../../FetchAndRedirectPage', () => ({
  default: ({ endpoint }: { endpoint: string }) => (
    <div data-testid="fetch-redirect" data-endpoint={endpoint}>loading</div>
  ),
}));

describe('RoomByCodePage', () => {
  it('renders without crashing', () => {
    render(<RoomByCodePage />);
  });

  it('renders FetchAndRedirectPage', () => {
    render(<RoomByCodePage />);
    expect(screen.getByTestId('fetch-redirect')).toBeInTheDocument();
  });

  it('passes correct endpoint to FetchAndRedirectPage', () => {
    render(<RoomByCodePage />);
    expect(screen.getByTestId('fetch-redirect')).toHaveAttribute(
      'data-endpoint',
      '/api/pub/room/get/link/byshortcode'
    );
  });
});
