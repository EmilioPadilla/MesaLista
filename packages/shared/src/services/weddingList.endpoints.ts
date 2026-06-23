export const weddingListEndpoints = {
  base: `/wedding-list`,
  getByCouple: (coupleId: number) => `/wedding-list/${coupleId}`,
  getBySlug: (slug: string) => `/wedding-list/slug/${slug}`,
  update: (id: number) => `/wedding-list/${id}`,
  getGiftsByWeddingList: (weddingListId: number) => `/wedding-list/${weddingListId}/gifts`,
  getCategoriesByWeddingList: (weddingListId: number) =>
    `/wedding-list/${weddingListId}/wedding-list-by-category`,
  reorderGifts: (weddingListId: number) => `/wedding-list/${weddingListId}/reorder`,
};
