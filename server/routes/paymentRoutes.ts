import express from 'express';
import paymentController from '../controllers/paymentController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     PaymentType:
 *       type: string
 *       enum: [PAYPAL, STRIPE, BANK_TRANSFER, OTHER]
 *     MoneyBag:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: The auto-generated id of the money bag
 *         cartId:
 *           type: integer
 *           description: The ID of the cart this payment is for
 *         amount:
 *           type: number
 *           format: float
 *           description: Total payment amount
 *         currency:
 *           type: string
 *           description: Currency code (e.g., USD)
 *         paymentType:
 *           $ref: '#/components/schemas/PaymentType'
 *         paymentId:
 *           type: string
 *           description: External payment ID from payment provider
 *         transactionFee:
 *           type: number
 *           format: float
 *           description: Fee charged by payment provider
 *         paymentStatus:
 *           type: string
 *           description: Status from payment provider
 *         payerEmail:
 *           type: string
 *           description: Email of the payer
 *         payerName:
 *           type: string
 *           description: Name of the payer
 */

/**
 * @swagger
 * /payments/initiate:
 *   post:
 *     summary: Initiate a payment process
 *     tags: [Payments]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - cartId
 *               - paymentType
 *               - returnUrl
 *               - cancelUrl
 *             properties:
 *               cartId:
 *                 type: integer
 *                 description: ID of the cart to process payment for
 *               paymentType:
 *                 $ref: '#/components/schemas/PaymentType'
 *               returnUrl:
 *                 type: string
 *                 description: URL to redirect after successful payment
 *               cancelUrl:
 *                 type: string
 *                 description: URL to redirect after cancelled payment
 *     responses:
 *       200:
 *         description: Payment initiated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 paymentId:
 *                   type: string
 *                 approvalUrl:
 *                   type: string
 *                   description: URL to redirect user for payment approval
 *                 message:
 *                   type: string
 *       400:
 *         description: Invalid request
 *       404:
 *         description: Cart not found
 *       500:
 *         description: Server error
 */
router.post('/initiate', paymentController.initiatePayment);

/**
 * @swagger
 * /payments/verify:
 *   post:
 *     summary: Verify and complete a payment
 *     tags: [Payments]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - paymentId
 *               - paymentType
 *             properties:
 *               paymentId:
 *                 type: string
 *                 description: ID of the payment to verify
 *               paymentType:
 *                 $ref: '#/components/schemas/PaymentType'
 *               payerId:
 *                 type: string
 *                 description: PayPal payer ID (required for PayPal)
 *               token:
 *                 type: string
 *                 description: Stripe session token (required for Stripe)
 *     responses:
 *       200:
 *         description: Payment verified successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 moneyBagId:
 *                   type: integer
 *                 cartId:
 *                   type: integer
 *                 message:
 *                   type: string
 *       400:
 *         description: Invalid request
 *       404:
 *         description: Payment not found
 *       500:
 *         description: Server error
 */
router.post('/verify', paymentController.verifyPayment);

/**
 * @swagger
 * /payments/{id}/summary:
 *   get:
 *     summary: Get payment summary
 *     tags: [Payments]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID of the money bag
 *     responses:
 *       200:
 *         description: Payment summary
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalAmount:
 *                   type: number
 *                   format: float
 *                 currency:
 *                   type: string
 *                 itemCount:
 *                   type: integer
 *                 paymentStatus:
 *                   type: string
 *                 paymentDate:
 *                   type: string
 *                   format: date-time
 *                 paymentType:
 *                   $ref: '#/components/schemas/PaymentType'
 *                 transactionId:
 *                   type: string
 *       400:
 *         description: Money bag ID is required
 *       404:
 *         description: Payment record not found
 *       500:
 *         description: Server error
 */
router.get('/:id/summary', paymentController.getPaymentSummary);

/**
 * @swagger
 * /payments:
 *   get:
 *     summary: Get all payments
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all payments
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   amount:
 *                     type: number
 *                     format: float
 *                   currency:
 *                     type: string
 *                   paymentType:
 *                     $ref: '#/components/schemas/PaymentType'
 *                   paymentStatus:
 *                     type: string
 *                   paymentDate:
 *                     type: string
 *                     format: date-time
 *                   inviteeName:
 *                     type: string
 *                   inviteeEmail:
 *                     type: string
 *       500:
 *         description: Server error
 */
router.get('/', authenticateToken, paymentController.getAllPayments);

export default router;
