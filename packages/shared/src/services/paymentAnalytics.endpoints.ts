export const paymentAnalyticsEndpoints = {
  summary: `/admin/payment-analytics/summary`,
  lists: `/admin/payment-analytics/lists`,
  listPayments: (giftListId: number) => `/admin/payment-analytics/lists/${giftListId}/payments`,
};
