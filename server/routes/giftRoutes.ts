import express from 'express';
import giftController from '../controllers/giftController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Apply authentication middleware to all gift routes
router.use(authenticateToken);

/**
 * @swagger
 * components:
 *   schemas:
 *     Gift:
 *       type: object
 *       required:
 *         - title
 *         - price
 *         - weddingListId
 *       properties:
 *         id:
 *           type: integer
 *           description: The auto-generated id of the gift
 *         title:
 *           type: string
 *           description: The title of the gift
 *         description:
 *           type: string
 *           description: The description of the gift
 *         price:
 *           type: number
 *           description: The price of the gift
 *         imageUrl:
 *           type: string
 *           description: URL to the gift image
 *         category:
 *           type: string
 *           description: Category of the gift
 *         isPurchased:
 *           type: boolean
 *           description: Whether the gift has been purchased
 *         weddingListId:
 *           type: integer
 *           description: The ID of the wedding list this gift belongs to
 *     WeddingList:
 *       type: object
 *       required:
 *         - coupleId
 *         - title
 *         - coupleName
 *         - weddingDate
 *       properties:
 *         id:
 *           type: integer
 *           description: The auto-generated id of the wedding list
 *         coupleId:
 *           type: integer
 *           description: The ID of the couple who owns this list
 *         title:
 *           type: string
 *           description: The title of the wedding list
 *         description:
 *           type: string
 *           description: The description of the wedding list
 *         coupleName:
 *           type: string
 *           description: The name of the couple
 *         weddingDate:
 *           type: string
 *           format: date-time
 *           description: The date of the wedding
 *         imageUrl:
 *           type: string
 *           description: URL to the wedding image
 *     GiftPurchase:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: The auto-generated id of the purchase
 *         giftId:
 *           type: integer
 *           description: The ID of the purchased gift
 *         userId:
 *           type: integer
 *           description: The ID of the user who made the purchase
 *         message:
 *           type: string
 *           description: Optional message from the purchaser
 *         status:
 *           type: string
 *           enum: [PENDING, CONFIRMED, DELIVERED, CANCELLED]
 *           description: Status of the purchase
 *         purchaseDate:
 *           type: string
 *           format: date-time
 *           description: The date when the purchase was made
 */

/**
 * @swagger
 * /gifts/wedding-list/{weddingListId}:
 *   get:
 *     summary: Get all gifts for a specific wedding list
 *     tags: [Gifts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: weddingListId
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID of the wedding list
 *     responses:
 *       200:
 *         description: A list of gifts
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Gift'
 *       400:
 *         description: Wedding list ID is required
 *       500:
 *         description: Server error
 */
router.get('/wedding-list/:weddingListId', giftController.getGiftsByWeddingList);

/**
 * @swagger
 * /gifts/{id}:
 *   get:
 *     summary: Get a gift by ID
 *     tags: [Gifts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID of the gift
 *     responses:
 *       200:
 *         description: Gift details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Gift'
 *       404:
 *         description: Gift not found
 *       500:
 *         description: Server error
 */
/**
 * @swagger
 * /gifts/wedding-lists:
 *   get:
 *     summary: Get all wedding lists
 *     tags: [Wedding Lists]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: A list of wedding lists
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/WeddingList'
 *       500:
 *         description: Server error
 */
router.get('/wedding-lists', giftController.getAllWeddingLists);

router.get('/:id', giftController.getGiftById);

/**
 * @swagger
 * /gifts:
 *   post:
 *     summary: Create a new gift
 *     tags: [Gifts]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - price
 *               - weddingListId
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *               imageUrl:
 *                 type: string
 *               category:
 *                 type: string
 *               weddingListId:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Gift created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Gift'
 *       400:
 *         description: Missing required fields
 *       500:
 *         description: Server error
 */
router.post('/', giftController.createGift);

/**
 * @swagger
 * /gifts/{id}:
 *   put:
 *     summary: Update a gift
 *     tags: [Gifts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID of the gift
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *               imageUrl:
 *                 type: string
 *               category:
 *                 type: string
 *     responses:
 *       200:
 *         description: Gift updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Gift'
 *       404:
 *         description: Gift not found
 *       500:
 *         description: Server error
 */
router.put('/:id', giftController.updateGift);

/**
 * @swagger
 * /gifts/{id}:
 *   delete:
 *     summary: Delete a gift
 *     tags: [Gifts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID of the gift to delete
 *     responses:
 *       200:
 *         description: Gift deleted successfully
 *       404:
 *         description: Gift not found
 *       500:
 *         description: Server error
 */
router.delete('/:id', giftController.deleteGift);

/**
 * @swagger
 * /gifts/wedding-list/couple/{coupleId}:
 *   get:
 *     summary: Get wedding list by couple ID
 *     tags: [Wedding Lists]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: coupleId
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID of the couple
 *     responses:
 *       200:
 *         description: Wedding list details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/WeddingList'
 *       404:
 *         description: Wedding list not found
 *       500:
 *         description: Server error
 */
router.get('/wedding-list/couple/:coupleId', giftController.getWeddingListByCouple);

/**
 * @swagger
 * /gifts/wedding-list:
 *   post:
 *     summary: Create a new wedding list
 *     tags: [Wedding Lists]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - coupleId
 *               - title
 *               - coupleName
 *               - weddingDate
 *             properties:
 *               coupleId:
 *                 type: integer
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               coupleName:
 *                 type: string
 *               weddingDate:
 *                 type: string
 *                 format: date
 *               imageUrl:
 *                 type: string
 *     responses:
 *       201:
 *         description: Wedding list created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/WeddingList'
 *       400:
 *         description: Missing required fields
 *       409:
 *         description: A wedding list for this couple already exists
 *       500:
 *         description: Server error
 */
router.post('/wedding-list', giftController.createWeddingList);

/**
 * @swagger
 * /gifts/purchase/{giftId}:
 *   post:
 *     summary: Purchase a gift
 *     tags: [Gift Purchases]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: giftId
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID of the gift to purchase
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               message:
 *                 type: string
 *                 description: Optional message from the purchaser
 *     responses:
 *       201:
 *         description: Gift purchased successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 purchase:
 *                   $ref: '#/components/schemas/GiftPurchase'
 *                 gift:
 *                   $ref: '#/components/schemas/Gift'
 *       400:
 *         description: Gift is already purchased or missing required fields
 *       404:
 *         description: Gift not found
 *       500:
 *         description: Server error
 */
router.post('/purchase/:giftId', giftController.purchaseGift);

/**
 * @swagger
 * /gifts/purchases/{purchaseId}:
 *   patch:
 *     summary: Update purchase status
 *     tags: [Gift Purchases]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: purchaseId
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID of the purchase
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [PENDING, CONFIRMED, DELIVERED, CANCELLED]
 *     responses:
 *       200:
 *         description: Purchase status updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/GiftPurchase'
 *       400:
 *         description: Missing required fields
 *       404:
 *         description: Purchase not found
 *       500:
 *         description: Server error
 */
router.patch('/purchases/:purchaseId', giftController.updatePurchaseStatus);

/**
 * @swagger
 * /gifts/purchased/{coupleId}:
 *   get:
 *     summary: Get all purchased gifts for a couple
 *     tags: [Gift Purchases]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: coupleId
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID of the couple
 *     responses:
 *       200:
 *         description: List of purchased gifts
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 purchases:
 *                   type: array
 *                   items:
 *                     type: object
 *                 totalAmount:
 *                   type: number
 *                 count:
 *                   type: integer
 *       404:
 *         description: Wedding list not found
 *       500:
 *         description: Server error
 */
router.get('/purchased/:coupleId', giftController.getPurchasedGifts);

/**
 * @swagger
 * /gifts/user-purchases/{userId}:
 *   get:
 *     summary: Get all purchases made by a user
 *     tags: [Gift Purchases]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID of the user
 *     responses:
 *       200:
 *         description: List of user's purchases
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 purchases:
 *                   type: array
 *                   items:
 *                     type: object
 *                 count:
 *                   type: integer
 *       500:
 *         description: Server error
 */
router.get('/user-purchases/:userId', giftController.getUserPurchases);

export default router;
