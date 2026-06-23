export const giftEndpoints = {
  base: `/gift`,
  getByWeddingList: (weddingListId: number) => `/gift/wedding-list/${weddingListId}`,
  byId: (id: number) => `/gift/${id}`,
};

// Purchase operations act on gifts; colocated with the gift endpoints.
export const purchaseEndpoints = {
  purchaseGift: (giftId: number) => `/gifts/purchase/${giftId}`,
  updateStatus: (purchaseId: number) => `/gifts/purchases/${purchaseId}`,
  getPurchasedGifts: (coupleId: number) => `/gifts/purchased/${coupleId}`,
  getUserPurchases: (userId: number) => `/gifts/user-purchases/${userId}`,
};
