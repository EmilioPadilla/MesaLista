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
    base: `/users`,
    /**
     * Get all users
     * @method GET
     * @access Protected
     * @requires JWT token
     */
    getAll: `/users`,
    /**
     * Get user by ID
     * @method GET
     * @access Protected
     * @requires JWT token
     * @param id User ID
     */
    getById: (id) => `/users/${id}`,
    /**
     * Update user
     * @method PUT
     * @access Protected
     * @requires JWT token
     * @param id User ID
     */
    update: (id) => `/users/${id}`,
    /**
     * Delete user
     * @method DELETE
     * @access Protected
     * @requires JWT token
     * @param id User ID
     */
    delete: (id) => `/users/${id}`,
};
/**
 * Gift management endpoints
 */
export const gift_endpoints = {
    /**
     * Base gifts endpoint
     */
    base: `/gifts`,
    /**
     * Get all gifts for a wedding list
     * @method GET
     * @access Protected
     * @requires JWT token
     * @param weddingListId Wedding list ID
     */
    getByWeddingList: (weddingListId) => `/gifts/wedding-list/${weddingListId}`,
    /**
     * Get gift by ID
     * @method GET
     * @access Protected
     * @requires JWT token
     * @param id Gift ID
     */
    getById: (id) => `/gifts/${id}`,
    /**
     * Create a new gift
     * @method POST
     * @access Protected
     * @requires JWT token
     */
    create: `/gifts`,
    /**
     * Update a gift
     * @method PUT
     * @access Protected
     * @requires JWT token
     * @param id Gift ID
     */
    update: (id) => `/gifts/${id}`,
    /**
     * Delete a gift
     * @method DELETE
     * @access Protected
     * @requires JWT token
     * @param id Gift ID
     */
    delete: (id) => `/gifts/${id}`,
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
    getAll: `/gifts/wedding-lists`,
    /**
     * Get wedding list by couple ID
     * @method GET
     * @access Protected
     * @requires JWT token
     * @param coupleId Couple ID
     */
    getByCouple: (coupleId) => `/gifts/wedding-list/couple/${coupleId}`,
    /**
     * Create a new wedding list
     * @method POST
     * @access Protected
     * @requires JWT token
     */
    create: `/gifts/wedding-list`,
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
    purchaseGift: (giftId) => `/gifts/purchase/${giftId}`,
    /**
     * Update purchase status
     * @method PATCH
     * @access Protected
     * @requires JWT token
     * @param purchaseId Purchase ID
     */
    updateStatus: (purchaseId) => `/gifts/purchases/${purchaseId}`,
    /**
     * Get all purchased gifts for a couple
     * @method GET
     * @access Protected
     * @requires JWT token
     * @param coupleId Couple ID
     */
    getPurchasedGifts: (coupleId) => `/gifts/purchased/${coupleId}`,
    /**
     * Get all purchases made by a user
     * @method GET
     * @access Protected
     * @requires JWT token
     * @param userId User ID
     */
    getUserPurchases: (userId) => `/gifts/user-purchases/${userId}`,
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
    getSummary: (id) => `/payments/${id}/summary`,
    /**
     * Get all payments
     * @method GET
     * @access Protected
     * @requires JWT token
     */
    getAll: `/payments`,
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
    payments: payment_endpoints,
    docs: docs_endpoints,
};
export default api_endpoints;
