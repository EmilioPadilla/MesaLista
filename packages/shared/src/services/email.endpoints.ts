export const emailEndpoints = {
  resendPaymentConfirmation: `/email/resend-payment-confirmation`,
  resendPaymentToAdmin: `/email/resend-payment-to-admin`,
  resendPaymentToInvitee: `/email/resend-payment-to-invitee`,
  sendContactForm: `/email/contact`,
  getCommissionUsers: `/email/marketing/commission-users`,
  sendToSelectedUsers: `/email/marketing/send-to-selected`,
  getEmailPreview: (emailType: number | string, userId: number) =>
    `/email/marketing/preview?emailType=${emailType}&userId=${userId}`,
  sendToLeads: `/email/marketing/send-to-leads`,
  sendMarketingEmailToUser: `/email/marketing/send-to-user`,
};

export const emailVerificationEndpoints = {
  sendCode: `/email-verification/send`,
  verifyCode: `/email-verification/verify`,
  checkStatus: (email: string) => `/email-verification/check/${encodeURIComponent(email)}`,
};
