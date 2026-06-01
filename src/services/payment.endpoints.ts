export const paymentEndpoints = {
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
  getPurchasedGiftsByWeddingList: (weddingListId: number) =>
    `/payments/wedding-list/${weddingListId}/purchased-gifts`,
};
