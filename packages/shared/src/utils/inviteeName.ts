// Older invitees were stored with this placeholder when no last name was given.
const LEGACY_LAST_NAME_PLACEHOLDER = 'Sin Apellido';

/** The last name to display, hiding the placeholder older rows still carry. */
export const inviteeLastName = (lastName?: string | null) => (lastName && lastName !== LEGACY_LAST_NAME_PLACEHOLDER ? lastName : '');

/** An invitee's name as people should read it. */
export const inviteeFullName = (invitee: { firstName?: string | null; lastName?: string | null }) =>
  [invitee.firstName, inviteeLastName(invitee.lastName)].filter(Boolean).join(' ');
