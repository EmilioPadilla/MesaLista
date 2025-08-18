/**
 * Payment type enum
 */
export enum PaymentType {
  PAYPAL = 'PAYPAL',
  STRIPE = 'STRIPE',
  BANK_TRANSFER = 'BANK_TRANSFER',
}

/**
 * Payment status enum
 */
export enum PaymentStatus {
  PENDING = 'PENDING',
  REIMBURSED = 'REIMBURSED',
  PAID = 'PAID',
  CANCELLED = 'CANCELLED',
}

/**
 * Payment interface
 */
export interface Payment {
  id: number;
  cartId: number;
  paymentId: string;
  currency: string;
  paymentType: PaymentType;
  transactionFee?: number;
  amount: number;
  status: PaymentStatus;
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
  token?: string; // For Stripe
}

/**
 * Payment verification response
 */
export interface VerifyPaymentResponse {
  success: boolean;
  paymentId?: number;
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
  status: PaymentStatus;
  paymentDate: string;
  paymentType: PaymentType;
  transactionId: string;
}
