import express from 'express';
import userController from '../controllers/userController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Public routes (no authentication required)
router.post('/', userController.createUser); // Registration is public

router.post('/login', userController.loginUser); // Login is public

// Protected routes (authentication required)
router.get('/me', authenticateToken, userController.getCurrentUser); // Get current user

router.get('/', authenticateToken, userController.getAllUsers);

router.get('/:id', authenticateToken, userController.getUserById);

router.put('/:id', authenticateToken, userController.updateUser);

router.delete('/:id', authenticateToken, userController.deleteUser);

export default router;
