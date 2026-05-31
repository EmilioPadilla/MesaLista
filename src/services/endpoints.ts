export const auth_endpoints = {
  register: `/users`,
  login: `/users/login`,
};

export const user_endpoints = {
  base: `/user`,
  signupCommission: `/user/signup/commission`,
  getCurrentUser: `/user/me`,
  byId: (id: number) => `/user/${id}`,
  bySlug: (slug: string) => `/user/slug/${slug}`,
  checkSlug: (slug: string) => `/user/check-slug/${slug}`,
  login: `/user/login`,
  logout: `/user/logout`,
  updateProfile: `/user/me/profile`,
  updatePassword: `/user/me/password`,
  deleteCurrentUser: `/user/me`,
  requestPasswordReset: `/user/password-reset/request`,
  verifyResetToken: (token: string) => `/user/password-reset/verify/${token}`,
  resetPassword: `/user/password-reset/reset`,
  updatePlanType: (userId: number) => `/user/${userId}/plan-type`,
};

export const gift_endpoints = {
  base: `/gift`,
  getByWeddingList: (weddingListId: number) => `/gift/wedding-list/${weddingListId}`,
  byId: (id: number) => `/gift/${id}`,
};

export const weddingList_endpoints = {
  base: `/wedding-list`,
  getByCouple: (coupleId: number) => `/wedding-list/${coupleId}`,
  getBySlug: (slug: string) => `/wedding-list/slug/${slug}`,
  update: (id: number) => `/wedding-list/${id}`,
  getGiftsByWeddingList: (weddingListId: number) => `/wedding-list/${weddingListId}/gifts`,
  getCategoriesByWeddingList: (weddingListId: number) => `/wedding-list/${weddingListId}/wedding-list-by-category`,
  reorderGifts: (weddingListId: number) => `/wedding-list/${weddingListId}/reorder`,
};

export const purchase_endpoints = {
  purchaseGift: (giftId: number) => `/gifts/purchase/${giftId}`,
  updateStatus: (purchaseId: number) => `/gifts/purchases/${purchaseId}`,
  getPurchasedGifts: (coupleId: number) => `/gifts/purchased/${coupleId}`,
  getUserPurchases: (userId: number) => `/gifts/user-purchases/${userId}`,
};

export const cart_endpoints = {
  base: `/cart`,
  addItem: `/cart/add`,
  byId: (giftId: number) => `/cart/item/${giftId}`,
  updateDetails: (giftId: number) => `/cart/${giftId}/details`,
};

export const docs_endpoints = {
  swagger: `/docs`,
};

export const payment_endpoints = {
  base: `/payments`,
  initiate: `/payments/initiate`,
  createCheckoutSession: `/payments/create-checkout-session`,
  verify: `/payments/verify`,
  getSummary: (id: number) => `/payments/${id}/summary`,
  getAll: `/payments`,
  createPayPalOrder: `/payments/create-paypal-order`,
  capturePayPalPayment: `/payments/capture-paypal-payment`,
  cancelPayment: `/payments/cancel-payment`,
  createPlanCheckoutSession: `/payments/create-plan-checkout-session`,
  completePlanSignupSession: `/payments/complete-plan-signup-session`,
  createGiftListCheckoutSession: `/payments/create-gift-list-checkout-session`,
  getPurchasedGiftsByWeddingList: (weddingListId: number) => `/payments/wedding-list/${weddingListId}/purchased-gifts`,
};

export const email_endpoints = {
  resendPaymentConfirmation: `/email/resend-payment-confirmation`,
  resendPaymentToAdmin: `/email/resend-payment-to-admin`,
  resendPaymentToInvitee: `/email/resend-payment-to-invitee`,
  sendContactForm: `/email/contact`,
  getCommissionUsers: `/email/marketing/commission-users`,
  sendToSelectedUsers: `/email/marketing/send-to-selected`,
  getEmailPreview: (emailType: number | string, userId: number) => `/email/marketing/preview?emailType=${emailType}&userId=${userId}`,
  sendToLeads: `/email/marketing/send-to-leads`,
  sendMarketingEmailToUser: `/email/marketing/send-to-user`,
};

export const emailVerification_endpoints = {
  sendCode: `/email-verification/send`,
  verifyCode: `/email-verification/verify`,
  checkStatus: (email: string) => `/email-verification/check/${encodeURIComponent(email)}`,
};

export const analytics_endpoints = {
  upsertSession: `/analytics/events/session`,
  logEvent: `/analytics/events`,
  summary: `/analytics/admin/metrics/summary`,
  timeSeries: `/analytics/admin/metrics/time_series`,
  funnelBreakdown: `/analytics/admin/metrics/funnel_breakdown`,
  alerts: `/analytics/admin/metrics/alerts`,
  aggregate: `/analytics/admin/metrics/aggregate`,
  cleanup: `/analytics/admin/metrics/cleanup`,
};

const giftList_endpoints = {
  base: `/gift-list`,
  getAll: `/gift-list`,
  getByUser: (userId: number) => `/gift-list/user/${userId}`,
  getById: (giftListId: number) => `/gift-list/${giftListId}`,
  getFirstByUserSlug: (userSlug: string) => `/gift-list/by-slug/${userSlug}`,
  update: (id: number) => `/gift-list/${id}`,
  delete: (id: number) => `/gift-list/${id}`,
  getGiftsByGiftList: (giftListId: number) => `/gift-list/${giftListId}/gifts`,
  getCategoriesByGiftList: (giftListId: number) => `/gift-list/${giftListId}/categories`,
  reorderGifts: (giftListId: number) => `/gift-list/${giftListId}/reorder`,
};

const predesignedList_endpoints = {
  getAll: `/predesigned-lists`,
  getById: (id: number) => `/predesigned-lists/${id}`,
  addGiftToWeddingList: (giftId: number, weddingListId: number) => `/predesigned-lists/${giftId}/add-to-wedding-list`,
};

const discountCode_endpoints = {
  validate: (code: string) => `/discount-codes/validate/${code}`,
  getAllAdmin: `/discount-codes/admin/all`,
  getStatsAdmin: (id: number) => `/discount-codes/admin/${id}/stats`,
  createAdmin: `/discount-codes/admin`,
  updateAdmin: (id: number) => `/discount-codes/admin/${id}`,
  deleteAdmin: (id: number) => `/discount-codes/admin/${id}`,
};

const usersListsAnalytics_endpoints = {
  summary: `/admin/users-lists-analytics/summary`,
  users: `/admin/users-lists-analytics/users`,
  lists: `/admin/users-lists-analytics/lists`,
};

const paymentAnalytics_endpoints = {
  summary: `/admin/payment-analytics/summary`,
  lists: `/admin/payment-analytics/lists`,
  listPayments: (giftListId: number) => `/admin/payment-analytics/lists/${giftListId}/payments`,
};

const rsvp_endpoints = {
  getInvitees: `/rsvp/invitees`,
  getInviteeByCode: (secretCode: string) => `/rsvp/invitee/${secretCode}`,
  validateRsvpCode: (secretCode: string) => `/rsvp/validate/${secretCode}`,
  createInvitee: `/rsvp/invitees`,
  bulkCreateInvitees: `/rsvp/invitees/bulk`,
  updateInvitee: (id: string) => `/rsvp/invitees/${id}`,
  deleteInvitee: (id: string) => `/rsvp/invitees/${id}`,
  bulkDeleteInvitees: `/rsvp/invitees/bulk-delete`,
  bulkUpdateInviteeStatus: `/rsvp/invitees/bulk-update-status`,
  respondToRsvp: (secretCode: string) => `/rsvp/respond/${secretCode}`,
  getStats: `/rsvp/stats`,
  getMessages: (giftListId: number) => `/rsvp/messages/${giftListId}`,
  updateMessages: `/rsvp/messages`,
  getCustomFields: (giftListId: number) => `/rsvp/custom-fields/${giftListId}`,
  createCustomField: `/rsvp/custom-fields`,
  updateCustomField: (id: number) => `/rsvp/custom-fields/${id}`,
  deleteCustomField: (id: number) => `/rsvp/custom-fields/${id}`,
  getCustomFieldResponses: `/rsvp/custom-field-responses`,
};

export const invitation_endpoints = {
  base: `/invitations`,
  byGiftListId: (giftListId: number) => `/invitations/gift-list/${giftListId}`,
  byGiftListIdPublic: (giftListId: number) => `/invitations/gift-list/${giftListId}/public`,
  bySlug: (slug: string) => `/invitations/slug/${slug}`,
  byId: (id: number) => `/invitations/${id}`,
  create: `/invitations`,
  update: (id: number) => `/invitations/${id}`,
  publish: (id: number) => `/invitations/${id}/publish`,
  delete: (id: number) => `/invitations/${id}`,
};

export const signupEmail_endpoints = {
  save: `/signup-emails`,
  getAll: `/signup-emails`,
  addManual: `/signup-emails/manual`,
  delete: (id: number) => `/signup-emails/${id}`,
  markConverted: `/signup-emails/mark-converted`,
};

export const endpoints = {
  auth: auth_endpoints,
  users: user_endpoints,
  gifts: gift_endpoints,
  weddingLists: weddingList_endpoints,
  giftLists: giftList_endpoints,
  purchases: purchase_endpoints,
  payments: payment_endpoints,
  email: email_endpoints,
  emailVerification: emailVerification_endpoints,
  analytics: analytics_endpoints,
  docs: docs_endpoints,
  predesignedLists: predesignedList_endpoints,
  discountCodes: discountCode_endpoints,
  usersListsAnalytics: usersListsAnalytics_endpoints,
  paymentAnalytics: paymentAnalytics_endpoints,
  rsvp: rsvp_endpoints,
  invitations: invitation_endpoints,
  signupEmails: signupEmail_endpoints,
};

export const api_endpoints = endpoints;

export default api_endpoints;
