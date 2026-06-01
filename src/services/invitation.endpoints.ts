export const invitationEndpoints = {
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
