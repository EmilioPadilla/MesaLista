import crypto from 'crypto';
import bcrypt from 'bcrypt';
import prisma from '../lib/prisma.js';
import passwordValidationService from './passwordValidationService.js';

// Token expires in 1 hour
const TOKEN_EXPIRATION_HOURS = 1;

export interface PasswordResetData {
  userId: number;
  email: string;
  firstName: string;
  token: string;
  expiresAt: Date;
}

class PasswordResetService {
  /**
   * Generate a secure random token for password reset
   */
  private generateResetToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Create a password reset token for a user
   * Returns the token and expiration time
   */
  async createPasswordResetToken(email: string): Promise<PasswordResetData | null> {
    try {
      // Find user by email
      const user = await prisma.user.findUnique({
        where: { email: email.toLowerCase() },
      });

      if (!user) {
        // Don't reveal if user exists or not for security
        return null;
      }

      // Generate unique token
      const token = this.generateResetToken();
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + TOKEN_EXPIRATION_HOURS);

      // Invalidate any existing unused tokens for this user
      await prisma.passwordReset.updateMany({
        where: {
          userId: user.id,
          used: false,
        },
        data: {
          used: true,
        },
      });

      // Create new password reset token
      await prisma.passwordReset.create({
        data: {
          userId: user.id,
          token,
          expiresAt,
        },
      });

      return {
        userId: user.id,
        email: user.email,
        firstName: user.firstName,
        token,
        expiresAt,
      };
    } catch (error) {
      console.error('Error creating password reset token:', error);
      throw error;
    }
  }

  /**
   * Verify if a password reset token is valid
   * Returns user info if valid, null otherwise
   */
  async verifyResetToken(token: string): Promise<{ userId: number; email: string; firstName: string } | null> {
    try {
      const resetToken = await prisma.passwordReset.findUnique({
        where: { token },
        include: {
          user: true,
        },
      });

      if (!resetToken) {
        return null;
      }

      // Check if token is expired
      if (new Date() > resetToken.expiresAt) {
        return null;
      }

      // Check if token has already been used
      if (resetToken.used) {
        return null;
      }

      return {
        userId: resetToken.user.id,
        email: resetToken.user.email,
        firstName: resetToken.user.firstName,
      };
    } catch (error) {
      console.error('Error verifying reset token:', error);
      throw error;
    }
  }

  /**
   * Reset user password using a valid token
   */
  async resetPassword(token: string, newPassword: string): Promise<{ success: boolean; errors?: string[] }> {
    try {
      // Verify token
      const tokenData = await this.verifyResetToken(token);

      if (!tokenData) {
        return { success: false, errors: ['Token inválido o expirado'] };
      }

      // Validate password strength and history
      const validation = await passwordValidationService.validatePasswordForReset(tokenData.userId, newPassword);

      if (!validation.isValid) {
        return { success: false, errors: validation.errors };
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Get current password to save to history
      const currentUser = await prisma.user.findUnique({
        where: { id: tokenData.userId },
        select: { password: true },
      });

      // Update user password and unlock account if locked
      await prisma.user.update({
        where: { id: tokenData.userId },
        data: {
          password: hashedPassword,
          lockedUntil: null,
          failedLoginAttempts: 0,
        },
      });

      // Save old password to history
      if (currentUser?.password) {
        await passwordValidationService.savePasswordToHistory(tokenData.userId, currentUser.password);
      }

      // Mark token as used
      await prisma.passwordReset.update({
        where: { token },
        data: { used: true },
      });

      // Invalidate all user sessions for security
      await prisma.session.deleteMany({
        where: { userId: tokenData.userId },
      });

      return { success: true };
    } catch (error) {
      console.error('Error resetting password:', error);
      throw error;
    }
  }

  /**
   * Clean up expired password reset tokens
   * Should be run periodically (e.g., daily)
   */
  async cleanupExpiredTokens(): Promise<number> {
    try {
      const result = await prisma.passwordReset.deleteMany({
        where: {
          expiresAt: {
            lt: new Date(),
          },
        },
      });

      console.log(`Cleaned up ${result.count} expired password reset tokens`);
      return result.count;
    } catch (error) {
      console.error('Error cleaning up expired tokens:', error);
      throw error;
    }
  }
}

export default new PasswordResetService();
