export const giftListEndpoints = {
  base: `/gift-list`,
  getAll: `/gift-list`,
  getByUser: (userId: number) => `/gift-list/user/${userId}`,
  getById: (giftListId: number) => `/gift-list/${giftListId}`,
  getFirstByUserSlug: (userSlug: string) => `/gift-list/by-slug/${userSlug}`,
  publish: (id: number) => `/gift-list/${id}/publish`,
  update: (id: number) => `/gift-list/${id}`,
  delete: (id: number) => `/gift-list/${id}`,
  getGiftsByGiftList: (giftListId: number) => `/gift-list/${giftListId}/gifts`,
  getCategoriesByGiftList: (giftListId: number) => `/gift-list/${giftListId}/categories`,
  reorderGifts: (giftListId: number) => `/gift-list/${giftListId}/reorder`,
};
