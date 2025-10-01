/**
 * This file contains the API endpoints for the MesaLista application.
 */

/**
 * Authentication endpoints
 */
export const auth_endpoints = {
  /**
   * Register a new user
   * @method POST
   * @access Public
   */
  register: `/users`,

  /**
   * Login a user and get JWT token
   * @method POST
   * @access Public
   */
  login: `/users/login`,

  /**
   * Get the current authenticated user's information
   * @method GET
   * @access Protected
   * @requires JWT token
   */
  getCurrentUser: `/users/me`,
};

/**
 * User management endpoints
 */
export const user_endpoints = {
  /**
   * Base users endpoint
   */
  base: `/user`,

  /**
   * Get current user
   * @method GET
   * @access Protected
   * @requires JWT token
   */
  getCurrentUser: `/user/me`,

  /**
   * Get user by ID
   * @method GET
   * @access Protected
   * @requires JWT token
   * @param id User ID
   */
  byId: (id: number) => `/user/${id}`,

  /**
   * Get user by couple slug
   * @method GET
   * @access Public
   * @param coupleSlug Couple slug
   */
  bySlug: (coupleSlug: string) => `/user/slug/${coupleSlug}`,

  /**
   * Login user
   * @method POST
   * @access Public
   */
  login: `/user/login`,

  /**
   * Logout user
   * @method POST
   * @access Public
   */
  logout: `/user/logout`,
};

/**
 * Gift management endpoints
 */
export const gift_endpoints = {
  /**
   * Base gifts endpoint
   */
  base: `/gift`,

  /**
   * Get all gifts for a wedding list
   * @method GET
   * @access Protected
   * @requires JWT token
   * @param weddingListId Wedding list ID
   */
  getByWeddingList: (weddingListId: number) => `/gift/wedding-list/${weddingListId}`,

  /**
   * Get gift by ID
   * @method GET
   * @access Protected
   * @requires JWT token
   * @param id Gift ID
   */
  byId: (id: number) => `/gift/${id}`,
};

/**
 * Wedding list endpoints
 */
export const weddingList_endpoints = {
  /**
   * Base payments endpoint
   */
  base: `/wedding-list`,

  /**
   * Get wedding list by couple ID
   * @method GET
   * @access Protected
   * @requires JWT token
   * @param coupleId Couple ID
   */
  getByCouple: (coupleId: number) => `/wedding-list/${coupleId}`,

  /**
   * Get wedding list by couple slug
   * @method GET
   * @access Public
   * @param coupleSlug Couple slug
   */
  getBySlug: (coupleSlug: string) => `/wedding-list/slug/${coupleSlug}`,

  /**
   * Update a wedding list
   * @method PUT
   * @access Protected
   * @requires JWT token
   * @param id Wedding list ID
   */
  update: (id: number) => `/wedding-list/${id}`,

  /**
   * Get gifts in a wedding list
   * @method GET
   * @access Protected
   * @requires JWT token
   * @param weddingListId Wedding list ID
   */
  getGiftsByWeddingList: (weddingListId: number) => `/wedding-list/${weddingListId}/gifts`,

  /**
   * Get categories in a wedding list
   * @method GET
   * @access Protected
   * @requires JWT token
   * @param weddingListId Wedding list ID
   */
  getCategoriesByWeddingList: (weddingListId: number) => `/wedding-list/${weddingListId}/wedding-list-by-category`,

  /**
   * Reorder gifts in a wedding list
   * @method PUT
   * @access Protected
   * @requires JWT token
   * @param weddingListId Wedding list ID
   */
  reorderGifts: (weddingListId: number) => `/wedding-list/${weddingListId}/reorder`,
};

/**
 * Gift purchase endpoints
 */
export const purchase_endpoints = {
  /**
   * Purchase a gift
   * @method POST
   * @access Protected
   * @requires JWT token
   * @param giftId Gift ID
   */
  purchaseGift: (giftId: number) => `/gifts/purchase/${giftId}`,

  /**
   * Update purchase status
   * @method PATCH
   * @access Protected
   * @requires JWT token
   * @param purchaseId Purchase ID
   */
  updateStatus: (purchaseId: number) => `/gifts/purchases/${purchaseId}`,

  /**
   * Get all purchased gifts for a couple
   * @method GET
   * @access Protected
   * @requires JWT token
   * @param coupleId Couple ID
   */
  getPurchasedGifts: (coupleId: number) => `/gifts/purchased/${coupleId}`,

  /**
   * Get all purchases made by a user
   * @method GET
   * @access Protected
   * @requires JWT token
   * @param userId User ID
   */
  getUserPurchases: (userId: number) => `/gifts/user-purchases/${userId}`,
};

/**
 * Cart endpoints
 */
export const cart_endpoints = {
  /**
   * Base cart endpoint
   */
  base: `/cart`,

  /**
   * Add item to cart
   * @method POST
   * @access Protected
   * @requires JWT token
   */
  addItem: `/cart/add`,

  /**
   * Remove item from cart
   * @method DELETE
   * @method GET
   * @method PUT
   * @access Protected
   * @requires JWT token
   * @param giftId Gift ID
   */
  byId: (giftId: number) => `/cart/item/${giftId}`,

  /**
   Update details from Cart
   @method PUT
   @access Protected
   @requires JWT token
   @param giftId Gift ID
   */
  updateDetails: (giftId: number) => `/cart/${giftId}/details`,

  /**
   * Checkout cart
   * @method POST
   * @access Protected
   * @requires JWT token
   */
  checkout: (giftId: number) => `/cart/${giftId}/checkout`,
};

/**
 * Documentation endpoints
 */
export const docs_endpoints = {
  /**
   * Swagger API documentation
   * @method GET
   * @access Public
   */
  swagger: `/docs`,
};

/**
 * Payment endpoints
 */
export const payment_endpoints = {
  /**
   * Base payments endpoint
   */
  base: `/payments`,

  /**
   * Initiate a payment process
   * @method POST
   * @access Public
   */
  initiate: `/payments/initiate`,

  /**
   * Create Stripe checkout session
   * @method POST
   * @access Public
   */
  createCheckoutSession: `/payments/create-checkout-session`,

  /**
   * Verify and complete a payment
   * @method POST
   * @access Public
   */
  verify: `/payments/verify`,

  /**
   * Get payment summary
   * @method GET
   * @access Public
   * @param id Money bag ID
   */
  getSummary: (id: number) => `/payments/${id}/summary`,

  /**
   * Get all payments
   * @method GET
   * @access Protected
   * @requires JWT token
   */
  getAll: `/payments`,

  /**
   * Create PayPal order
   * @method POST
   * @access Public
   */
  createPayPalOrder: `/payments/create-paypal-order`,

  /**
   * Capture PayPal payment
   * @method POST
   * @access Public
   */
  capturePayPalPayment: `/payments/capture-paypal-payment`,

  /**
   * Cancel payment (Stripe or PayPal)
   * @method POST
   * @access Public
   */
  cancelPayment: `/payments/cancel-payment`,
};

/**
 * Email endpoints
 */
export const email_endpoints = {
  /**
   * Resend payment confirmation emails
   * @method POST
   * @access Public
   */
  resendPaymentConfirmation: `/email/resend-payment-confirmation`,
};

/**
 * Combined endpoints for easy access
 */
export const endpoints = {
  auth: auth_endpoints,
  users: user_endpoints,
  gifts: gift_endpoints,
  weddingLists: weddingList_endpoints,
  purchases: purchase_endpoints,
  payments: payment_endpoints,
  email: email_endpoints,
  docs: docs_endpoints,
};

export const api_endpoints = endpoints;

export default api_endpoints;
