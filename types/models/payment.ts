/**
 * Payment type enum
 */
export enum PaymentType {
  PAYPAL = 'PAYPAL',
  STRIPE = 'STRIPE',
  BANK_TRANSFER = 'BANK_TRANSFER',
  OTHER = 'OTHER'
}

/**
 * Money bag interface
 */
export interface MoneyBag {
  id: number;
  cartId: number;
  amount: number;
  currency: string;
  paymentType: PaymentType;
  paymentId: string;
  transactionFee?: number;
  paymentStatus: string;
  payerEmail?: string;
  payerName?: string;
  metadata?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Payment initialization request
 */
export interface InitiatePaymentRequest {
  cartId: number;
  paymentType: PaymentType;
  returnUrl: string;
  cancelUrl: string;
}

/**
 * Payment initialization response
 */
export interface InitiatePaymentResponse {
  success: boolean;
  paymentId?: string;
  approvalUrl?: string;
  message: string;
}

/**
 * Payment verification request
 */
export interface VerifyPaymentRequest {
  paymentId: string;
  paymentType: PaymentType;
  payerId?: string; // For PayPal
  token?: string;   // For Stripe
}

/**
 * Payment verification response
 */
export interface VerifyPaymentResponse {
  success: boolean;
  moneyBagId?: number;
  cartId?: number;
  message: string;
}

/**
 * Payment summary interface
 */
export interface PaymentSummary {
  totalAmount: number;
  currency: string;
  itemCount: number;
  paymentStatus: string;
  paymentDate: string;
  paymentType: PaymentType;
  transactionId: string;
}
