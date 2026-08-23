import apiClient from './client';
import type { CreateGiftListRequest, UpdateGiftListRequest } from 'types/api/giftList';
import { giftListEndpoints } from './giftList.endpoints';
import { GiftListWithGifts } from 'types/models/giftList';

export const giftListService = {
  getAllGiftLists: async (): Promise<any[]> => {
    const response = await apiClient.get(giftListEndpoints.base);
    return response.data;
  },

  getGiftListsByUser: async (userId: number): Promise<GiftListWithGifts[]> => {
    const response = await apiClient.get(giftListEndpoints.getByUser(userId));
    return response.data;
  },

  getGiftListById: async (giftListId: number): Promise<GiftListWithGifts> => {
    const response = await apiClient.get(giftListEndpoints.getById(giftListId));
    return response.data;
  },

  /**
   * The registry a guest lands on at /:slug.
   *
   * Credentials are attached when the caller has a session — the endpoint is
   * public and works fine without one, but the server uses the session to let a
   * couple preview their own unpublished draft. Sending `skipAuth` here would
   * make the owner look like any other guest and 404 them out of their own list.
   */
  getGiftListBySlug: async (slug: string): Promise<GiftListWithGifts> => {
    const response = await apiClient.get(giftListEndpoints.getFirstByUserSlug(slug));
    return response.data;
  },

  createGiftList: async (data: CreateGiftListRequest): Promise<any> => {
    const response = await apiClient.post(giftListEndpoints.base, data);
    return response.data;
  },

  /**
   * Publishes a draft on the given plan.
   *
   * Only COMMISSION goes through here. FIXED requires a settled payment, so it
   * is published server-side by the payment flow once Stripe or Apple confirms —
   * calling this with FIXED returns 402.
   */
  publishGiftList: async (id: number, planType: 'COMMISSION'): Promise<any> => {
    const response = await apiClient.post(giftListEndpoints.publish(id), { planType });
    return response.data;
  },

  updateGiftList: async (id: number, data: UpdateGiftListRequest): Promise<any> => {
    const response = await apiClient.put(giftListEndpoints.update(id), data);
    return response.data;
  },

  deleteGiftList: async (id: number): Promise<void> => {
    await apiClient.delete(giftListEndpoints.delete(id));
  },

  getGiftsByGiftList: async (giftListId: number): Promise<any> => {
    const response = await apiClient.get(giftListEndpoints.getGiftsByGiftList(giftListId));
    return response.data;
  },

  /**
   * Categories are gated exactly like the list itself, so credentials must ride
   * along: the endpoint is public for a published registry, but an owner
   * previewing their own draft is only recognised by their session. `skipAuth`
   * here would strip the mobile Bearer token and 404 the couple out of their own
   * categories (web is unaffected — axios always sends the cookie).
   */
  getCategoriesByGiftList: async (giftListId: number): Promise<any> => {
    const response = await apiClient.get(giftListEndpoints.getCategoriesByGiftList(giftListId));
    return response.data;
  },

  reorderGifts: async (giftListId: number, giftOrders: Array<{ giftId: number; order: number }>): Promise<any> => {
    const response = await apiClient.put(giftListEndpoints.reorderGifts(giftListId), { giftOrders });
    return response.data;
  },
};

export default giftListService;
