import express from 'express';
import userController from '../controllers/userController.js';
import { authenticateSession, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Public routes (no authentication required)
router.post('/', userController.createUser); // Registration is public

router.post('/login', userController.loginUser); // Login is public

router.get('/slug/:slug', userController.getUserBySlug); // Get user by couple slug

router.get('/check-slug/:slug', userController.checkSlugAvailability); // Check if slug is available

// Password reset routes (public)
router.post('/password-reset/request', userController.requestPasswordReset); // Request password reset

router.get('/password-reset/verify/:token', userController.verifyResetToken); // Verify reset token

router.post('/password-reset/reset', userController.resetPassword); // Reset password

// Logout route
router.post('/logout', userController.logoutUser); // Logout is public but requires session

// Protected routes (authentication required)
router.get('/me', authenticateSession, userController.getCurrentUser); // Get current user

router.put('/me/profile', authenticateSession, userController.updateCurrentUserProfile); // Update current user profile

router.put('/me/password', authenticateSession, userController.updateCurrentUserPassword); // Update current user password

router.delete('/me', authenticateSession, userController.deleteCurrentUser); // Delete current user

router.get('/', authenticateSession, userController.getAllUsers);

router.get('/:id', authenticateSession, userController.getUserById);

router.delete('/:id', authenticateSession, requireAdmin, userController.deleteUser);

export default router;
