export const userEndpoints = {
  base: `/user`,
  // Free signup — creates the couple plus a draft list. The plan is chosen later
  // at giftListEndpoints.publish.
  signup: `/user/signup`,
  // Legacy: publishes a commission list straight out of signup. Kept only for
  // App Store builds <= 1.0.2 (18).
  signupCommission: `/user/signup/commission`,
  getCurrentUser: `/user/me`,
  byId: (id: number) => `/user/${id}`,
  bySlug: (slug: string) => `/user/slug/${slug}`,
  checkSlug: (slug: string) => `/user/check-slug/${slug}`,
  checkEmail: `/user/check-email`,
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
