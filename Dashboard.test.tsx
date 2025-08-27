import React from 'react';
import { render, screen } from '@testing-library/react';
import Dashboard from '../../client/src/pages/dashboard';

// Mock auth + query hooks to bypass loading states
jest.mock('../../client/src/hooks/useAuth', () => ({ useAuth: () => ({ user: { id: 'u1' } }) }));
jest.mock('@tanstack/react-query', () => {
  const actual = jest.requireActual('@tanstack/react-query');
  return {
    ...actual,
    useQuery: () => ({ data: { kpis: { streak: 5, xp: 1234 } }, isLoading: false }),
  };
});

test('renders dashboard content', async () => {
  render(<Dashboard />);
  expect(await screen.findByText('EiQ★')).toBeInTheDocument();
  expect(screen.getByText('SikatLabs')).toBeInTheDocument();
});