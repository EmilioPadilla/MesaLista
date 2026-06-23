export const cartEndpoints = {
  base: `/cart`,
  addItem: `/cart/add`,
  byId: (giftId: number) => `/cart/item/${giftId}`,
  updateDetails: (giftId: number) => `/cart/${giftId}/details`,
};
