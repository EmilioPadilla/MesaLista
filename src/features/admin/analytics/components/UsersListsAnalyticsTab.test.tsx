import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { UsersListsAnalyticsTab } from './UsersListsAnalyticsTab';
import type { UserAnalytics, WeddingListAnalytics } from 'services/usersListsAnalytics.service';

const userA = {
  id: 1,
  email: 'a@x.com',
  firstName: 'Ana',
  lastName: 'Ruiz',
  spouseFirstName: 'Luis',
  spouseLastName: 'Paz',
  slug: 'ana-luis',
  phoneNumber: null,
  planType: 'FIXED',
  discountCode: 'WED10',
  createdAt: '2025-01-01T00:00:00.000Z',
  lastLoginAt: null,
  weddingList: {
    id: 10,
    title: 'Boda Ana y Luis',
    coupleName: 'Ana & Luis',
    weddingDate: '2025-12-01T00:00:00.000Z',
    totalGifts: 40,
    purchasedGifts: 24,
    totalValue: 48000,
    totalReceived: 20000,
    purchaseRate: 60,
    invitationCount: 120,
  },
} as UserAnalytics;

const userB = {
  id: 2,
  email: 'b@x.com',
  firstName: 'Mara',
  lastName: 'Soto',
  spouseFirstName: null,
  spouseLastName: null,
  slug: null,
  phoneNumber: null,
  planType: null,
  discountCode: null,
  createdAt: '2025-02-01T00:00:00.000Z',
  lastLoginAt: null,
  weddingList: null,
} as UserAnalytics;

const list10 = {
  id: 10,
  title: 'Boda Ana y Luis',
  coupleName: 'Ana & Luis',
  weddingDate: '2025-12-01T00:00:00.000Z',
  createdAt: '2025-01-02T00:00:00.000Z',
  coupleEmail: 'A@X.com',
  couplePlanType: 'FIXED',
  slug: 'ana-luis',
  totalGifts: 40,
  purchasedGifts: 24,
  totalValue: 48000,
  totalReceived: 20000,
  purchaseRate: 60,
  invitationCount: 120,
  invitationsAccepted: 80,
  invitationsRejected: 10,
  invitationsPending: 30,
  lastPurchaseDate: '2025-06-01T00:00:00.000Z',
  isActive: true,
  isPublic: true,
} as WeddingListAnalytics;

const list11 = { ...list10, id: 11, title: 'Segunda Lista', coupleEmail: 'a@x.com', slug: 'segunda' };

describe('UsersListsAnalyticsTab merge', () => {
  it('shows one row per list plus couples without a list, and no duplicates', () => {
    render(
      <UsersListsAnalyticsTab
        summary={undefined}
        isSummaryLoading={false}
        usersData={[userA, userB]}
        isUsersLoading={false}
        listsData={[list10, list11]}
        isListsLoading={false}
      />,
    );

    expect(screen.getByText('Boda Ana y Luis')).toBeInTheDocument();
    expect(screen.getByText('Segunda Lista')).toBeInTheDocument();
    // Couple with no list still appears, exactly once, flagged.
    expect(screen.getByText('Mara Soto')).toBeInTheDocument();
    expect(screen.getAllByText('Sin lista')).toHaveLength(1);
    // Ana has a list, so she must not also appear as a "sin lista" row.
    expect(screen.queryByText('Ana Ruiz y Luis')).not.toBeInTheDocument();
    // 3 body rows
    expect(document.querySelectorAll('.ant-table-tbody tr.ant-table-row')).toHaveLength(3);
  });
});

describe('desktop layout', () => {
  it('renders the wide column set when above the md breakpoint', () => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: (query: string) => ({
        matches: true,
        media: query,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => false,
      }),
    });

    render(
      <UsersListsAnalyticsTab
        summary={undefined}
        isSummaryLoading={false}
        usersData={[userA, userB]}
        isUsersLoading={false}
        listsData={[list10, list11]}
        isListsLoading={false}
      />,
    );

    expect(screen.getAllByText('Invitaciones').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Fecha Boda').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Registro').length).toBeGreaterThan(0);
    expect(screen.getAllByText('$48,000.00').length).toBeGreaterThan(0);
  });
});
