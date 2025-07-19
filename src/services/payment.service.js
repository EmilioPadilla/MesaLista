import apiClient from './client';
import { api_endpoints } from './endpoints';
/**
 * Service for handling payment-related API calls
 */
export const paymentService = {
    /**
     * Get all payments
     * @returns List of payments
     */
    getAllPayments: async () => {
        const response = await apiClient.get(api_endpoints.payments.getAll);
        return response.data;
    },
    /**
     * Get payment summary by ID
     *
     * @param id Payment ID
     * @returns Payment summary
     */
    getPaymentSummary: async (id) => {
        const response = await apiClient.get(api_endpoints.payments.getSummary(id));
        return response.data;
    },
    /**
     * Initiate a payment process
     *
     * @param data Payment initiation data
     * @returns Payment initiation response
     */
    initiatePayment: async (data) => {
        const response = await apiClient.post(api_endpoints.payments.initiate, data);
        return response.data;
    },
    /**
     * Verify and complete a payment
     *
     * @param data Payment verification data
     * @returns Payment verification response
     */
    verifyPayment: async (data) => {
        const response = await apiClient.post(api_endpoints.payments.verify, data);
        return response.data;
    },
};
export default paymentService;
