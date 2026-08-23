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
  useCheckEmailAvailability: () => ({ mutateAsync: vi.fn().mockResolvedValue({ available: true }), isPending: false }),
  // Signup is free now: it creates a draft rather than taking payment, so there
  // is no plan-checkout hook to stub any more.
  useSignup: () => ({ mutateAsync: vi.fn() }),
}));

vi.mock('hooks/useEmailVerification', () => ({
  useSendVerificationCode: () => ({ mutateAsync: sendVerificationCode, isPending: false }),
  useVerifyCode: () => ({ mutateAsync: vi.fn() }),
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

// TEST-W2 — signup is free and produces a draft. Plan choice and payment moved to
// the publish step, so neither should be reachable from signup any more.
describe('Signup flow shape', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('is four steps, not six', () => {
    renderSignup();
    expect(screen.getByText(/paso 1 de 4/i)).toBeInTheDocument();
  });

  it('shows no pricing on the details step', () => {
    renderSignup();
    expect(screen.queryByText(/\$2,000/)).not.toBeInTheDocument();
    expect(screen.queryByText(/3\.00%/)).not.toBeInTheDocument();
    expect(screen.queryByText(/elige tu plan/i)).not.toBeInTheDocument();
  });
});
