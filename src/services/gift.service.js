import apiClient from './client';
// Gift service
export const giftService = {
    // Gift purchase related functions
    fetchPurchasedGifts: async (coupleId) => {
        if (!coupleId) {
            return { purchases: [], totalAmount: 0, count: 0 };
        }
        const response = await apiClient.get(`/gifts/purchased/${coupleId}`);
        return response.data;
    },
    updatePurchaseStatus: async ({ purchaseId, status }) => {
        const response = await apiClient.patch(`/gifts/purchases/${purchaseId}`, {
            status: status.toUpperCase(),
        });
        return response.data;
    },
    getUserPurchases: async (userId) => {
        const response = await apiClient.get(`/gifts/user-purchases/${userId}`);
        return response.data;
    },
    purchaseGift: async (giftId, message) => {
        const response = await apiClient.post(`/gifts/purchase/${giftId}`, { message });
        return response.data;
    },
    // Gift management functions
    getGiftsByWeddingList: async (weddingListId) => {
        const response = await apiClient.get(`/gifts/wedding-list/${weddingListId}`);
        return response.data;
    },
    getGiftById: async (id) => {
        const response = await apiClient.get(`/gifts/${id}`);
        return response.data;
    },
    createGift: async (giftData) => {
        const response = await apiClient.post('/gifts', giftData);
        return response.data;
    },
    updateGift: async (id, giftData) => {
        const response = await apiClient.put(`/gifts/${id}`, giftData);
        return response.data;
    },
    deleteGift: async (id) => {
        await apiClient.delete(`/gifts/${id}`);
    },
    // Wedding list functions
    getAllWeddingLists: async () => {
        const response = await apiClient.get('/gifts/wedding-lists');
        return response.data;
    },
    getWeddingListByCouple: async (coupleId) => {
        const response = await apiClient.get(`/gifts/wedding-list/couple/${coupleId}`);
        return response.data;
    },
    createWeddingList: async (coupleId) => {
        const response = await apiClient.post('/gifts/wedding-list', { coupleId });
        return response.data;
    },
};
export default giftService;
