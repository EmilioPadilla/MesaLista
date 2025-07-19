import apiClient from './client';
import type { WeddingListBase, WeddingListWithGifts, CreateWeddingListRequest } from '../../shared/types/weddingList';
import { api_endpoints } from './endpoints';

/**
 * Fetches all wedding lists with their gifts
 * @returns List of wedding lists with gifts
 */
const getAllWeddingLists = async (): Promise<WeddingListWithGifts[]> => {
  const response = await apiClient.get(api_endpoints.weddingLists.getAll);
  return response.data;
};

/**
 * Fetches a wedding list by couple ID
 *
 * @param coupleId ID of the couple
 * @returns Wedding list with gifts
 */
const getWeddingListByCouple = async (coupleId: number): Promise<WeddingListWithGifts> => {
  const response = await apiClient.get(api_endpoints.weddingLists.getByCouple(coupleId));
  return response.data;
};

/**
 * Creates a new wedding list
 *
 * @param data Wedding list creation data
 * @returns Created wedding list
 */
const createWeddingList = async (data: CreateWeddingListRequest): Promise<WeddingListBase> => {
  const response = await apiClient.post(api_endpoints.weddingLists.create, data);
  return response.data;
};

/**
 * Updates an existing wedding list
 *
 * @param id Wedding list ID
 * @param data Wedding list update data
 * @returns Updated wedding list
 */
const updateWeddingList = async (id: number, data: Partial<CreateWeddingListRequest>): Promise<WeddingListBase> => {
  const response = await apiClient.put(`${api_endpoints.weddingLists.create}/${id}`, data);
  return response.data;
};

export const weddingListService = {
  getAllWeddingLists,
  getWeddingListByCouple,
  createWeddingList,
  updateWeddingList,
};

export default weddingListService;
