export type RsvpStatus = 'PENDING' | 'CONFIRMED' | 'REJECTED';

// Invitee as returned by RSVP endpoints. coupleId / giftListId are only
// populated by the guest /rsvp/by-code endpoint; the admin listing omits them.
export interface RsvpInvitee {
  id: string;
  firstName: string;
  lastName: string;
  tickets: number;
  secretCode: string;
  status: RsvpStatus;
  confirmedTickets?: number;
  guestMessage?: string;
  coupleId?: number;
  giftListId?: number;
}

// Form-input shape for the AddInviteeModal (create + edit).
export interface RsvpInviteeInput {
  firstName: string;
  lastName: string;
  tickets: number;
  secretCode: string;
}

// One row from a CSV import — all fields optional because parsing may leave holes.
export interface ImportInviteeRow {
  firstName?: string;
  lastName?: string;
  tickets?: number;
  secretCode?: string;
  guestMessage?: string;
  status?: RsvpStatus;
  hasWarnings?: boolean;
}

// A failed CSV-import row, surfaced by ImportErrorsAlert.
export interface ImportError {
  error: string;
  invitee?: ImportInviteeRow;
}
