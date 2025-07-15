/**
 * This file contains the API endpoints for the RegalAmor application.
 */

/**
 * Base API URL configuration
 */
const apiBase = '/api';

/**
 * Authentication endpoints
 */
export const auth_endpoints = {
  /**
   * Register a new user
   * @method POST
   * @access Public
   */
  register: `${apiBase}/users`,

  /**
   * Login a user and get JWT token
   * @method POST
   * @access Public
   */
  login: `${apiBase}/users/login`,

  /**
   * Get the current authenticated user's information
   * @method GET
   * @access Protected
   * @requires JWT token
   */
  getCurrentUser: `${apiBase}/users/me`,
};

/**
 * User management endpoints
 */
export const user_endpoints = {
  /**
   * Base users endpoint
   */
  base: `${apiBase}/users`,

  /**
   * Get all users
   * @method GET
   * @access Protected
   * @requires JWT token
   */
  getAll: `${apiBase}/users`,

  /**
   * Get user by ID
   * @method GET
   * @access Protected
   * @requires JWT token
   * @param id User ID
   */
  getById: (id: number) => `${apiBase}/users/${id}`,

  /**
   * Update user
   * @method PUT
   * @access Protected
   * @requires JWT token
   * @param id User ID
   */
  update: (id: number) => `${apiBase}/users/${id}`,

  /**
   * Delete user
   * @method DELETE
   * @access Protected
   * @requires JWT token
   * @param id User ID
   */
  delete: (id: number) => `${apiBase}/users/${id}`,
};

/**
 * Gift management endpoints
 */
export const gift_endpoints = {
  /**
   * Base gifts endpoint
   */
  base: `${apiBase}/gifts`,

  /**
   * Get all gifts for a wedding list
   * @method GET
   * @access Protected
   * @requires JWT token
   * @param weddingListId Wedding list ID
   */
  getByWeddingList: (weddingListId: number) => `${apiBase}/gifts/wedding-list/${weddingListId}`,

  /**
   * Get gift by ID
   * @method GET
   * @access Protected
   * @requires JWT token
   * @param id Gift ID
   */
  getById: (id: number) => `${apiBase}/gifts/${id}`,

  /**
   * Create a new gift
   * @method POST
   * @access Protected
   * @requires JWT token
   */
  create: `${apiBase}/gifts`,

  /**
   * Update a gift
   * @method PUT
   * @access Protected
   * @requires JWT token
   * @param id Gift ID
   */
  update: (id: number) => `${apiBase}/gifts/${id}`,

  /**
   * Delete a gift
   * @method DELETE
   * @access Protected
   * @requires JWT token
   * @param id Gift ID
   */
  delete: (id: number) => `${apiBase}/gifts/${id}`,
};

/**
 * Wedding list endpoints
 */
export const weddingList_endpoints = {
  /**
   * Get all wedding lists
   * @method GET
   * @access Protected
   * @requires JWT token
   */
  getAll: `${apiBase}/gifts/wedding-lists`,

  /**
   * Get wedding list by couple ID
   * @method GET
   * @access Protected
   * @requires JWT token
   * @param coupleId Couple ID
   */
  getByCouple: (coupleId: number) => `${apiBase}/gifts/wedding-list/couple/${coupleId}`,

  /**
   * Create a new wedding list
   * @method POST
   * @access Protected
   * @requires JWT token
   */
  create: `${apiBase}/gifts/wedding-list`,
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
  purchaseGift: (giftId: number) => `${apiBase}/gifts/purchase/${giftId}`,

  /**
   * Update purchase status
   * @method PATCH
   * @access Protected
   * @requires JWT token
   * @param purchaseId Purchase ID
   */
  updateStatus: (purchaseId: number) => `${apiBase}/gifts/purchases/${purchaseId}`,

  /**
   * Get all purchased gifts for a couple
   * @method GET
   * @access Protected
   * @requires JWT token
   * @param coupleId Couple ID
   */
  getPurchasedGifts: (coupleId: number) => `${apiBase}/gifts/purchased/${coupleId}`,

  /**
   * Get all purchases made by a user
   * @method GET
   * @access Protected
   * @requires JWT token
   * @param userId User ID
   */
  getUserPurchases: (userId: number) => `${apiBase}/gifts/user-purchases/${userId}`,
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
  swagger: `${apiBase}/docs`,
};

/**
 * Combined endpoints for easy access
 */
export const api_endpoints = {
  auth: auth_endpoints,
  users: user_endpoints,
  gifts: gift_endpoints,
  weddingLists: weddingList_endpoints,
  purchases: purchase_endpoints,
  docs: docs_endpoints,
};

export default api_endpoints;
