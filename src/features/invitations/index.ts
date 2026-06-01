// Public API for the invitations feature.
// Internal components (editor, sections, templates, etc.) stay private —
// pages compose them.

export { InvitationsPage } from './pages/InvitationsPage';
// Standalone guest-facing route, mounted directly by App.tsx outside any layout.
export { PublicInvitationView } from './components/PublicInvitation/PublicInvitationView';
