import express from 'express';
import userController from '../controllers/userController.js';
import { authenticateSession } from '../middleware/auth.js';

const router = express.Router();

// Public routes (no authentication required)
router.post('/', userController.createUser); // Registration is public

router.post('/login', userController.loginUser); // Login is public

router.get('/slug/:coupleSlug', userController.getUserBySlug); // Get user by couple slug

// Logout route
router.post('/logout', userController.logoutUser); // Logout is public but requires session

// Protected routes (authentication required)
router.get('/me', authenticateSession, userController.getCurrentUser); // Get current user

router.get('/', authenticateSession, userController.getAllUsers);

router.get('/:id', authenticateSession, userController.getUserById);

router.put('/:id', authenticateSession, userController.updateUser);

router.delete('/:id', authenticateSession, userController.deleteUser);

export default router;
