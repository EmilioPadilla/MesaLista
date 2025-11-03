import apiClient from './client';
import { api_endpoints } from './endpoints';

// Payment service types
export interface PaymentInitiateRequest {
  cartId: number;
  paymentType: 'PAYPAL' | 'STRIPE' | 'BANK_TRANSFER' | 'OTHER';
  returnUrl: string;
  cancelUrl: string;
}

export interface PaymentVerifyRequest {
  paymentId: string;
  paymentType: 'PAYPAL' | 'STRIPE' | 'BANK_TRANSFER' | 'OTHER';
  payerId?: string; // Required for PayPal
  token?: string; // Required for Stripe
}

export interface CreateCheckoutSessionRequest {
  cartId: number;
  orderId: string;
  successUrl: string;
  cancelUrl: string;
}

export interface CreatePayPalOrderRequest {
  cartId: number;
  successUrl: string;
  cancelUrl: string;
}

export interface CapturePayPalPaymentRequest {
  orderId: string;
}

export interface PaymentSummary {
  totalAmount: number;
  currency: string;
  itemCount: number;
  paymentStatus: string;
  paymentDate: string;
  paymentType: string;
  transactionId: string;
}

export interface Payment {
  id: number;
  amount: number;
  currency: string;
  paymentType: string;
  paymentStatus: string;
  paymentDate: string;
  inviteeName: string;
  inviteeEmail: string;
}

/**
 * Service for handling payment-related API calls
 */
export const paymentService = {
  /**
   * Get all payments
   * @returns List of payments
   */
  getAllPayments: async (): Promise<Payment[]> => {
    const response = await apiClient.get(api_endpoints.payments.getAll);
    return response.data;
  },

  /**
   * Get payment summary by ID
   *
   * @param id Payment ID
   * @returns Payment summary
   */
  getPaymentSummary: async (id: number): Promise<PaymentSummary> => {
    const response = await apiClient.get(api_endpoints.payments.getSummary(id));
    return response.data;
  },

  /**
   * Initiate a payment process
   *
   * @param data Payment initiation data
   * @returns Payment initiation response
   */
  initiatePayment: async (
    data: PaymentInitiateRequest,
  ): Promise<{ success: boolean; paymentId: string; approvalUrl: string; message: string }> => {
    const response = await apiClient.post(api_endpoints.payments.initiate, data);
    return response.data;
  },

  /**
   * Create Stripe checkout session
   *
   * @param data Checkout session data
   * @returns Checkout session response with URL
   */
  createCheckoutSession: async (data: CreateCheckoutSessionRequest): Promise<{ success: boolean; sessionId: string; url: string }> => {
    const response = await apiClient.post(api_endpoints.payments.createCheckoutSession, data);
    return response.data;
  },

  /**
   * Verify and complete a payment
   *
   * @param data Payment verification data
   * @returns Payment verification response
   */
  verifyPayment: async (data: PaymentVerifyRequest): Promise<{ success: boolean; moneyBagId: number; cartId: number; message: string }> => {
    const response = await apiClient.post(api_endpoints.payments.verify, data);
    return response.data;
  },

  /**
   * Create PayPal order
   *
   * @param data PayPal order data
   * @returns PayPal order response with approval URL
   */
  createPayPalOrder: async (data: CreatePayPalOrderRequest): Promise<{ success: boolean; orderId: string; approvalUrl: string }> => {
    const response = await apiClient.post(api_endpoints.payments.createPayPalOrder, data);
    return response.data;
  },

  /**
   * Capture PayPal payment
   *
   * @param data PayPal capture data
   * @returns PayPal capture response
   */
  capturePayPalPayment: async (data: CapturePayPalPaymentRequest): Promise<{ success: boolean; cartId: number; paymentId: string; message: string }> => {
    const response = await apiClient.post(api_endpoints.payments.capturePayPalPayment, data);
    return response.data;
  },

  /**
   * Cancel payment (Stripe or PayPal)
   *
   * @param data Payment cancellation data
   * @returns Payment cancellation response
   */
  cancelPayment: async (data: { cartId: string; paymentMethod?: string }): Promise<{ success: boolean; message: string; cartStatus: string }> => {
    const response = await apiClient.post(api_endpoints.payments.cancelPayment, data);
    return response.data;
  },

  /**
   * Create Stripe checkout session for plan payment
   *
   * @param data Plan checkout session data
   * @returns Checkout session response with URL
   */
  createPlanCheckoutSession: async (data: {
    planType: string;
    email: string;
    successUrl: string;
    cancelUrl: string;
    discountCode?: string;
  }): Promise<{ success: boolean; sessionId: string; url: string }> => {
    const response = await apiClient.post(api_endpoints.payments.createPlanCheckoutSession, data);
    return response.data;
  },
};

export default paymentService;
