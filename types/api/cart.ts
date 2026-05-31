export interface CartDetailsRequest {
  sessionId: string;
  inviteeName?: string;
  inviteeEmail?: string;
  phoneNumber?: string;
  message?: string;
  rsvpCode?: string;
}
