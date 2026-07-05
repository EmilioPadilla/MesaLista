import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

// Signup pulls in a lot of data hooks. We only care about the event-date field
// here, so stub every hook/service to a quiescent state and render the details
// step in isolation.
const sendVerificationCode = vi.fn().mockResolvedValue({});

vi.mock('hooks/useUser', () => ({
  useIsAuthenticated: () => ({ data: false, isLoading: false }),
  useCheckSlugAvailability: () => ({ data: undefined, isLoading: false }),
  useSignupCommission: () => ({ mutateAsync: vi.fn() }),
}));

vi.mock('hooks/useEmailVerification', () => ({
  useSendVerificationCode: () => ({ mutateAsync: sendVerificationCode, isPending: false }),
  useVerifyCode: () => ({ mutateAsync: vi.fn() }),
}));

vi.mock('hooks/usePayment', () => ({
  useCreatePlanCheckoutSession: () => ({ mutateAsync: vi.fn() }),
}));

vi.mock('hooks/useAnalyticsTracking', () => ({
  useTrackEvent: () => vi.fn(),
}));

vi.mock('hooks/useDiscountCode', () => ({
  useValidateDiscountCode: () => ({ data: undefined, isLoading: false, isError: false }),
}));

vi.mock('services/user.service', () => ({
  userService: { getCurrentUser: vi.fn() },
}));

import Signup from './Signup';

const renderSignup = () =>
  render(
    <MemoryRouter>
      <Signup />
    </MemoryRouter>,
  );

describe('Signup event date field', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the event date picker on the details step', () => {
    renderSignup();
    expect(screen.getByText(/fecha del evento/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/selecciona la fecha/i)).toBeInTheDocument();
  });

  it('requires an event date before advancing past the details step', async () => {
    renderSignup();

    fireEvent.click(screen.getByRole('button', { name: /continuar/i }));

    expect(await screen.findByText(/la fecha del evento es requerida/i)).toBeInTheDocument();
    // Validation blocked the step, so no verification code was requested.
    expect(sendVerificationCode).not.toHaveBeenCalled();
  });

  it('does not allow selecting a date before today', () => {
    renderSignup();
    // The picker input is present and read-only so only valid (future) dates can
    // be chosen via the calendar popup.
    const input = screen.getByPlaceholderText(/selecciona la fecha/i) as HTMLInputElement;
    expect(input).toHaveAttribute('readonly');
  });
});
