import express from 'express';
import cartController from '../controllers/cartController.js';

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     CartItem:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: The auto-generated id of the cart item
 *         cartId:
 *           type: integer
 *           description: The ID of the cart this item belongs to
 *         giftId:
 *           type: integer
 *           description: The ID of the gift
 *         quantity:
 *           type: integer
 *           description: Quantity of the gift in the cart
 *         gift:
 *           $ref: '#/components/schemas/Gift'
 *     Cart:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: The auto-generated id of the cart
 *         sessionId:
 *           type: string
 *           description: Unique session identifier for the cart
 *         inviteeName:
 *           type: string
 *           description: Name of the invitee who is shopping
 *         inviteeEmail:
 *           type: string
 *           description: Email of the invitee
 *         country:
 *           type: string
 *           description: Country of residence of the invitee
 *         phoneNumber:
 *           type: string
 *           description: Phone number of the invitee
 *         message:
 *           type: string
 *           description: Message to the couple from the invitee
 *         items:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/CartItem'
 */

/**
 * @swagger
 * /cart:
 *   get:
 *     summary: Get a cart by session ID or create a new one
 *     tags: [Cart]
 *     parameters:
 *       - in: query
 *         name: sessionId
 *         schema:
 *           type: string
 *         required: false
 *         description: Session ID of the cart (if not provided, a new cart will be created)
 *     responses:
 *       200:
 *         description: The cart
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Cart'
 *       500:
 *         description: Server error
 */
router.get('/', cartController.getCart);

/**
 * @swagger
 * /cart/add:
 *   post:
 *     summary: Add a gift to the cart
 *     tags: [Cart]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - giftId
 *             properties:
 *               giftId:
 *                 type: integer
 *                 description: ID of the gift to add
 *               quantity:
 *                 type: integer
 *                 description: Quantity to add (default is 1)
 *               sessionId:
 *                 type: string
 *                 description: Session ID of the cart
 *     responses:
 *       201:
 *         description: The updated cart
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Cart'
 *       400:
 *         description: Gift ID is required or gift is already purchased
 *       404:
 *         description: Gift not found
 *       500:
 *         description: Server error
 */
router.post('/add', cartController.addToCart);

/**
 * @swagger
 * /cart/item/{id}:
 *   put:
 *     summary: Update cart item quantity
 *     tags: [Cart]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID of the cart item
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - quantity
 *             properties:
 *               quantity:
 *                 type: integer
 *                 description: New quantity (must be at least 1)
 *     responses:
 *       200:
 *         description: The updated cart
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Cart'
 *       400:
 *         description: Cart item ID is required or quantity must be at least 1
 *       500:
 *         description: Server error
 */
router.put('/item/:id', cartController.updateCartItem);

/**
 * @swagger
 * /cart/item/{id}:
 *   delete:
 *     summary: Remove item from cart
 *     tags: [Cart]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID of the cart item
 *     responses:
 *       200:
 *         description: The updated cart
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Cart'
 *       400:
 *         description: Cart item ID is required
 *       404:
 *         description: Cart item not found
 *       500:
 *         description: Server error
 */
router.delete('/item/:id', cartController.removeFromCart);

/**
 * @swagger
 * /cart/{id}/details:
 *   put:
 *     summary: Update cart details (invitee information and message)
 *     tags: [Cart]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID of the cart
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               inviteeName:
 *                 type: string
 *                 description: Name of the invitee who is shopping
 *               inviteeEmail:
 *                 type: string
 *                 description: Email of the invitee
 *               country:
 *                 type: string
 *                 description: Country of residence of the invitee
 *               phoneNumber:
 *                 type: string
 *                 description: Phone number of the invitee
 *               message:
 *                 type: string
 *                 description: Message to the couple from the invitee
 *     responses:
 *       200:
 *         description: The updated cart
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Cart'
 *       400:
 *         description: Cart ID is required
 *       500:
 *         description: Server error
 */
router.put('/:id/details', cartController.updateCartDetails);

/**
 * @swagger
 * /cart/{id}/checkout:
 *   post:
 *     summary: Checkout cart - convert cart items to purchases
 *     tags: [Cart]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID of the cart
 *     responses:
 *       200:
 *         description: Checkout result
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 purchaseIds:
 *                   type: array
 *                   items:
 *                     type: integer
 *                 message:
 *                   type: string
 *       400:
 *         description: Cart ID is required, cart is empty, or required fields missing
 *       404:
 *         description: Cart not found
 *       500:
 *         description: Server error
 */
router.post('/:id/checkout', cartController.checkoutCart);

export default router;
