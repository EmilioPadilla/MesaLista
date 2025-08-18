import express from 'express';
import cartController from '../controllers/cartController.js';

const router = express.Router();

router.get('/', cartController.getCart);

router.post('/add', cartController.addToCart);

router.patch('/item/:id', cartController.updateCartItem);

router.delete('/item/:id', cartController.removeFromCart);

router.put('/:id/details', cartController.updateCartDetails);

router.post('/:id/checkout', cartController.checkoutCart);

export default router;
