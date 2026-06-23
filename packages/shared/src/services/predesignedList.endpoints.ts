export const predesignedListEndpoints = {
  getAll: `/predesigned-lists`,
  getById: (id: number) => `/predesigned-lists/${id}`,
  addGiftToWeddingList: (giftId: number, weddingListId: number) =>
    `/predesigned-lists/${giftId}/add-to-wedding-list`,
};
