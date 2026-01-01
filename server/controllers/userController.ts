import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { createSessionAndSetCookie, logoutSession } from '../middleware/auth.js';
import prisma from '../lib/prisma.js';
import {
  UserBase,
  UserCreateRequest,
  UserDashboardResponse,
  UserLoginRequest,
  UserLoginResponse,
  UserResponse,
} from '../../types/api/user.js';
import { UserRole } from '../../types/models/user.js';
import passwordResetService from '../services/passwordResetService.js';
import emailService from '../services/emailService.js';
import passwordValidationService from '../services/passwordValidationService.js';
import { discountCodeService } from '../services/discountCodeService.js';

export const userController = {
  // Get all users
  getAllUsers: async (req: Request, res: Response) => {
    try {
      const users = (await prisma.user.findMany({
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          spouseFirstName: true,
          spouseLastName: true,
          imageUrl: true,
          phoneNumber: true,
          role: true,
          createdAt: true,
          // Exclude password for security
        },
      })) as UserBase[];
      res.json(users);
    } catch (error: unknown) {
      console.error('Error fetching users:', error);
      res.status(500).json({ error: 'Failed to fetch users' });
    }
  },

  // Get current user
  getCurrentUser: async (req: Request, res: Response) => {
    try {
      // The user ID is extracted from the JWT token in the auth middleware
      if (!req.user?.userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const user = (await prisma.user.findUnique({
        where: { id: req.user.userId },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          spouseFirstName: true,
          coupleSlug: true,
          spouseLastName: true,
          imageUrl: true,
          phoneNumber: true,
          role: true,
          planType: true,
          createdAt: true,
          updatedAt: true,
        },
      })) as UserResponse;

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Add additional dashboard data
      // In a real app, you would fetch this from the database
      const dashboardData: UserDashboardResponse = {
        ...(user as UserBase),
        giftsCount: 0, // Placeholder - would be calculated from database
        totalAmount: 0, // Placeholder - would be calculated from database
      };

      res.json(dashboardData);
    } catch (error: unknown) {
      console.error('Error fetching current user:', error);
      res.status(500).json({ error: 'Failed to fetch user data' });
    }
  },

  // Get user by couple slug
  getUserBySlug: async (req: Request, res: Response) => {
    const { coupleSlug } = req.params;

    try {
      const user = (await prisma.user.findUnique({
        where: { coupleSlug },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          spouseFirstName: true,
          spouseLastName: true,
          coupleSlug: true,
          imageUrl: true,
          phoneNumber: true,
          role: true,
          createdAt: true,
          updatedAt: true,
        },
      })) as UserResponse;

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json(user);
    } catch (error: unknown) {
      console.error('Error fetching user by slug:', error);
      res.status(500).json({ error: 'Failed to fetch user' });
    }
  },

  // Get user by ID
  getUserById: async (req: Request, res: Response) => {
    const { id } = req.params;

    try {
      const user = (await prisma.user.findUnique({
        where: { id: Number(id) },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          spouseFirstName: true,
          spouseLastName: true,
          imageUrl: true,
          phoneNumber: true,
          role: true,
          createdAt: true,
          updatedAt: true,
        },
      })) as UserResponse;

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json(user);
    } catch (error: unknown) {
      console.error('Error fetching user:', error);
      res.status(500).json({ error: 'Failed to fetch user' });
    }
  },

  // Create new user
  createUser: async (req: Request, res: Response) => {
    const { email, firstName, lastName, spouseFirstName, spouseLastName, password, phoneNumber, role, planType, coupleSlug, discountCode } =
      req.body as UserCreateRequest & { discountCode?: string };

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    try {
      // Get discount code if provided (already validated during payment)
      let discountCodeRecord = null;
      if (discountCode) {
        discountCodeRecord = await discountCodeService.getDiscountCodeByCode(discountCode);
        if (!discountCodeRecord) {
          console.warn(`Discount code ${discountCode} not found during user creation`);
        }
      }

      // Hash the password before storing it
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      // Determine user role (now supporting ADMIN role as well)
      let userRole: UserRole = 'GUEST';
      if (role === 'COUPLE') {
        userRole = 'COUPLE';
      } else if (role === 'ADMIN') {
        userRole = 'ADMIN';
      }

      // Use a transaction to ensure both user and wedding list (if applicable) are created together
      const result = await prisma.$transaction(async (tx) => {
        // Create the user
        const user = await tx.user.create({
          data: {
            email,
            firstName,
            lastName,
            spouseFirstName,
            spouseLastName,
            password: hashedPassword,
            phoneNumber,
            role: userRole,
            coupleSlug,
            planType: planType || null,
            discountCodeId: discountCodeRecord?.id || null,
          },
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            spouseFirstName: true,
            spouseLastName: true,
            coupleSlug: true,
            imageUrl: true,
            phoneNumber: true,
            role: true,
            planType: true,
            createdAt: true,
          },
        });

        // Increment discount code usage count if a code was used
        if (discountCodeRecord) {
          await tx.discountCode.update({
            where: { id: discountCodeRecord.id },
            data: {
              usageCount: {
                increment: 1,
              },
            },
          });
        }

        // If the user is a COUPLE, automatically create a wedding list
        if (userRole === 'COUPLE') {
          // Calculate a default wedding date (1 year from now)
          const weddingDate = new Date();
          weddingDate.setFullYear(weddingDate.getFullYear() + 1);

          // Create a wedding list for the couple
          const weddingList = await tx.weddingList.create({
            data: {
              coupleId: user.id,
              title: `Lista de ${firstName}${spouseFirstName ? ' y ' + spouseFirstName : ''}`.trim(),
              coupleName: `${firstName}${spouseFirstName ? ' y ' + spouseFirstName : ''}`.trim(),
              weddingDate,
              description: 'Nuestra lista de regalos',
            },
          });

          // Create initial gift categories (upsert to avoid duplicates since categories are global)
          const defaultCategories = ['Cocina', 'Electrodomésticos', 'Viaje', 'Baño', 'Decoración', 'Otros'];

          await Promise.all(
            defaultCategories.map((categoryName) =>
              tx.giftCategory.upsert({
                where: { name: categoryName },
                update: {}, // Don't update if exists
                create: { name: categoryName },
              }),
            ),
          );

          // Return both user and wedding list
          return { user, weddingList };
        }

        // If not a COUPLE, just return the user
        return { user };
      });

      // Send admin notification email (non-blocking)
      if (userRole === 'COUPLE') {
        emailService
          .sendAdminSignupNotification({
            firstName,
            lastName,
            spouseFirstName,
            spouseLastName,
            email,
            phoneNumber,
            coupleSlug: coupleSlug || '',
            planType: planType as 'FIXED' | 'COMMISSION',
            discountCode,
            createdAt: result.user.createdAt,
          })
          .catch((error) => {
            console.error('Failed to send admin signup notification email:', error);
          });

        // Send welcome email to the new user (non-blocking)
        emailService
          .sendWelcomeEmail({
            email,
            firstName,
            spouseFirstName,
            coupleSlug: coupleSlug || '',
            planType: planType as 'FIXED' | 'COMMISSION',
          })
          .catch((error) => {
            console.error('Failed to send welcome email:', error);
          });
      }

      res.status(201).json(result.user);
    } catch (error: unknown) {
      console.error('Error creating user:', error);

      // Handle unique constraint violation
      if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
        return res.status(409).json({ error: 'Email already exists' });
      }

      res.status(500).json({ error: 'Failed to create user' });
    }
  },

  // Delete user
  deleteUser: async (req: Request, res: Response) => {
    const { id } = req.params;

    try {
      await prisma.user.delete({
        where: { id: Number(id) },
      });

      res.status(204).send();
    } catch (error: unknown) {
      console.error('Error deleting user:', error);

      if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') {
        return res.status(404).json({ error: 'User not found' });
      }

      res.status(500).json({ error: 'Failed to delete user' });
    }
  },

  // Update user plan type (admin only)
  updateUserPlanType: async (req: Request, res: Response) => {
    const { id } = req.params;
    const { planType } = req.body;

    if (!planType || !['FIXED', 'COMMISSION'].includes(planType)) {
      return res.status(400).json({ error: 'Valid plan type is required (FIXED or COMMISSION)' });
    }

    try {
      const user = await prisma.user.update({
        where: { id: Number(id) },
        data: { planType },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          spouseFirstName: true,
          spouseLastName: true,
          coupleSlug: true,
          phoneNumber: true,
          role: true,
          planType: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      res.json(user);
    } catch (error: unknown) {
      console.error('Error updating user plan type:', error);

      if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') {
        return res.status(404).json({ error: 'User not found' });
      }

      res.status(500).json({ error: 'Failed to update plan type' });
    }
  },

  // Login user
  loginUser: async (req: Request, res: Response) => {
    const { email, password } = req.body as UserLoginRequest;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const userAgent = req.get('User-Agent') || 'Unknown';
    const ipAddress = req.ip || req.connection.remoteAddress;

    try {
      // Find user by email
      const user = await prisma.user.findUnique({
        where: { email },
      });

      if (!user) {
        // Record failed attempt for non-existent user
        await passwordValidationService.recordLoginAttempt(email, null, false, ipAddress, userAgent);
        return res.status(401).json({ error: 'Credenciales inválidas' });
      }

      // Check if account is locked
      const lockStatus = await passwordValidationService.isAccountLocked(user.id);
      if (lockStatus.locked && lockStatus.lockedUntil) {
        const minutesRemaining = Math.ceil((lockStatus.lockedUntil.getTime() - Date.now()) / 60000);
        await passwordValidationService.recordLoginAttempt(email, user.id, false, ipAddress, userAgent);
        return res.status(423).json({
          error: `Cuenta bloqueada por múltiples intentos fallidos. Intenta de nuevo en ${minutesRemaining} minutos.`,
          lockedUntil: lockStatus.lockedUntil,
        });
      }

      // Compare provided password with stored hash
      const passwordMatch = await bcrypt.compare(password, user.password);

      if (!passwordMatch) {
        // Record failed attempt and handle lockout
        await passwordValidationService.recordLoginAttempt(email, user.id, false, ipAddress, userAgent);
        const lockResult = await passwordValidationService.handleFailedLogin(user.id);

        if (lockResult.locked && lockResult.lockedUntil) {
          const minutesRemaining = Math.ceil((lockResult.lockedUntil.getTime() - Date.now()) / 60000);
          return res.status(423).json({
            error: `Cuenta bloqueada por múltiples intentos fallidos. Intenta de nuevo en ${minutesRemaining} minutos.`,
            lockedUntil: lockResult.lockedUntil,
          });
        }

        return res.status(401).json({
          error: 'Credenciales inválidas',
          attemptsRemaining: lockResult.attemptsRemaining,
        });
      }

      // Successful login - reset failed attempts
      await passwordValidationService.resetFailedLoginAttempts(user.id);
      await passwordValidationService.recordLoginAttempt(email, user.id, true, ipAddress, userAgent);

      // Create session and set HttpOnly cookie
      await createSessionAndSetCookie(res, user.id, userAgent, ipAddress);

      // Return user data without password or token (token is now in HttpOnly cookie)
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password: passwordHash, ...userWithoutPassword } = user;

      const response: UserLoginResponse = {
        ...(userWithoutPassword as UserBase),
        token: '', // No longer needed since we use HttpOnly cookies
        message: 'Login successful',
      };

      res.json(response);
    } catch (error: unknown) {
      console.error('Error during login:', error);
      res.status(500).json({ error: 'Login failed' });
    }
  },

  // Logout user
  logoutUser: async (req: Request, res: Response) => {
    try {
      await logoutSession(req, res);
      res.json({ message: 'Logout successful' });
    } catch (error: unknown) {
      console.error('Error during logout:', error);
      res.status(500).json({ error: 'Logout failed' });
    }
  },

  // Update current user profile
  updateCurrentUserProfile: async (req: Request, res: Response) => {
    if (!req.user?.userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { firstName, lastName, spouseFirstName, spouseLastName, phoneNumber, coupleSlug } = req.body;

    try {
      const updateData: any = {};

      if (firstName !== undefined) updateData.firstName = firstName;
      if (lastName !== undefined) updateData.lastName = lastName;
      if (spouseFirstName !== undefined) updateData.spouseFirstName = spouseFirstName;
      if (spouseLastName !== undefined) updateData.spouseLastName = spouseLastName;
      if (phoneNumber !== undefined) updateData.phoneNumber = phoneNumber;
      if (coupleSlug !== undefined) {
        // Normalize the slug
        const normalizedSlug = coupleSlug
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '');

        // Check if slug is already taken by another user
        const existingUser = await prisma.user.findUnique({
          where: { coupleSlug: normalizedSlug },
        });

        if (existingUser && existingUser.id !== req.user.userId) {
          return res.status(409).json({ error: 'Este enlace ya está en uso' });
        }

        updateData.coupleSlug = normalizedSlug;
      }

      const user = await prisma.user.update({
        where: { id: req.user.userId },
        data: updateData,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          spouseFirstName: true,
          spouseLastName: true,
          coupleSlug: true,
          imageUrl: true,
          phoneNumber: true,
          role: true,
          planType: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      res.json(user);
    } catch (error: unknown) {
      console.error('Error updating user profile:', error);

      if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') {
        return res.status(404).json({ error: 'User not found' });
      }

      res.status(500).json({ error: 'Failed to update user profile' });
    }
  },

  // Update current user password
  updateCurrentUserPassword: async (req: Request, res: Response) => {
    if (!req.user?.userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required' });
    }

    try {
      // Get current user with password
      const user = await prisma.user.findUnique({
        where: { id: req.user.userId },
      });

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Verify current password
      const passwordMatch = await bcrypt.compare(currentPassword, user.password);

      if (!passwordMatch) {
        return res.status(401).json({ error: 'Current password is incorrect' });
      }

      // Validate password strength and history
      const validation = await passwordValidationService.validatePasswordForReset(req.user.userId, newPassword);

      if (!validation.isValid) {
        return res.status(400).json({
          error: validation.errors[0] || 'La contraseña no cumple con los requisitos de seguridad',
          errors: validation.errors,
        });
      }

      // Hash new password
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

      // Update password
      await prisma.user.update({
        where: { id: req.user.userId },
        data: { password: hashedPassword },
      });

      // Save old password to history
      await passwordValidationService.savePasswordToHistory(req.user.userId, user.password);

      res.json({ message: 'Password updated successfully' });
    } catch (error: unknown) {
      console.error('Error updating user password:', error);
      res.status(500).json({ error: 'Failed to update password' });
    }
  },

  // Check if couple slug is available
  checkSlugAvailability: async (req: Request, res: Response) => {
    const { slug } = req.params;
    const { excludeUserId } = req.query;

    if (!slug) {
      return res.status(400).json({ error: 'Slug is required' });
    }

    try {
      // Normalize the slug
      const normalizedSlug = slug
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');

      // Check if slug exists
      const existingUser = await prisma.user.findUnique({
        where: { coupleSlug: normalizedSlug },
        select: { id: true },
      });

      // If excludeUserId is provided, check if the existing user is the same as the one being updated
      const isAvailable = !existingUser || (excludeUserId && existingUser.id === Number(excludeUserId));

      res.json({
        available: isAvailable,
        slug: normalizedSlug,
        message: isAvailable ? 'Slug is available' : 'Slug is already taken',
      });
    } catch (error: unknown) {
      console.error('Error checking slug availability:', error);
      res.status(500).json({ error: 'Failed to check slug availability' });
    }
  },

  // Request password reset
  requestPasswordReset: async (req: Request, res: Response) => {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    try {
      // Create password reset token
      const resetData = await passwordResetService.createPasswordResetToken(email.toLowerCase());

      // Always return success to prevent email enumeration
      // Don't reveal if the email exists or not
      if (resetData) {
        // Generate reset link
        const baseUrl = process.env.FRONT_END_URL || 'http://localhost:5173';
        const resetLink = `${baseUrl}/restablecer-contrasena?token=${resetData.token}`;

        // Send password reset email
        await emailService.sendPasswordResetEmail(resetData.email, resetData.firstName, resetLink);
      }

      // Always return success message
      res.json({
        success: true,
        message: 'Si el correo existe, recibirás un enlace para restablecer tu contraseña',
      });
    } catch (error: unknown) {
      console.error('Error requesting password reset:', error);
      // Still return success to prevent email enumeration
      res.json({
        success: true,
        message: 'Si el correo existe, recibirás un enlace para restablecer tu contraseña',
      });
    }
  },

  // Verify password reset token
  verifyResetToken: async (req: Request, res: Response) => {
    const { token } = req.params;

    if (!token) {
      return res.status(400).json({ error: 'Token is required' });
    }

    try {
      const tokenData = await passwordResetService.verifyResetToken(token);

      if (!tokenData) {
        return res.status(400).json({
          valid: false,
          error: 'El enlace de restablecimiento es inválido o ha expirado',
        });
      }

      res.json({
        valid: true,
        email: tokenData.email,
        firstName: tokenData.firstName,
      });
    } catch (error: unknown) {
      console.error('Error verifying reset token:', error);
      res.status(500).json({ error: 'Failed to verify reset token' });
    }
  },

  // Reset password
  resetPassword: async (req: Request, res: Response) => {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ error: 'Token and new password are required' });
    }

    try {
      const result = await passwordResetService.resetPassword(token, newPassword);

      if (!result.success) {
        return res.status(400).json({
          error: result.errors?.[0] || 'El enlace de restablecimiento es inválido o ha expirado',
          errors: result.errors,
        });
      }

      res.json({
        success: true,
        message: 'Contraseña restablecida exitosamente',
      });
    } catch (error: unknown) {
      console.error('Error resetting password:', error);
      res.status(500).json({ error: 'Failed to reset password' });
    }
  },

  // Delete current user
  deleteCurrentUser: async (req: Request, res: Response) => {
    try {
      if (!req.user?.userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const userId = req.user.userId;

      // Delete user and all related data (cascading deletes should be handled by Prisma schema)
      await prisma.user.delete({
        where: { id: userId },
      });

      // Clear the session cookie
      res.clearCookie('session_token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
      });

      res.status(200).json({ message: 'Account deleted successfully' });
    } catch (error: unknown) {
      console.error('Error deleting current user:', error);

      if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') {
        return res.status(404).json({ error: 'User not found' });
      }

      res.status(500).json({ error: 'Failed to delete account' });
    }
  },
};

export default userController;
