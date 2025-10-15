import bcrypt from 'bcrypt';
import prisma from '../lib/prisma.js';

// Password history to check (prevent reuse of last N passwords)
const PASSWORD_HISTORY_COUNT = 5;

// Account lockout settings
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MINUTES = 30;

export interface PasswordStrength {
  score: number; // 0-4 (0=weak, 4=very strong)
  feedback: string[];
  isValid: boolean;
}

export interface PasswordValidationResult {
  isValid: boolean;
  errors: string[];
  strength?: PasswordStrength;
}

class PasswordValidationService {
  /**
   * Validate password strength and requirements
   */
  validatePasswordStrength(password: string): PasswordStrength {
    const feedback: string[] = [];
    let score = 0;

    // Length check
    if (password.length >= 8) {
      score++;
    } else {
      feedback.push('La contraseña debe tener al menos 8 caracteres');
    }

    // Uppercase check
    if (/[A-Z]/.test(password)) {
      score++;
    } else {
      feedback.push('Debe incluir al menos una letra mayúscula');
    }

    // Lowercase check
    if (/[a-z]/.test(password)) {
      score++;
    } else {
      feedback.push('Debe incluir al menos una letra minúscula');
    }

    // Number check
    if (/\d/.test(password)) {
      score++;
    } else {
      feedback.push('Debe incluir al menos un número');
    }

    // Special character check (bonus)
    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      score++;
      if (feedback.length === 0) {
        feedback.push('¡Excelente! Tu contraseña es muy segura');
      }
    }

    const isValid = score >= 4; // Minimum score of 4 (length + uppercase + lowercase + number)

    return {
      score: Math.min(score, 4),
      feedback,
      isValid,
    };
  }

  /**
   * Check if password has been used recently
   */
  async checkPasswordHistory(userId: number, newPassword: string): Promise<boolean> {
    try {
      // Get recent password history
      const history = await prisma.passwordHistory.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: PASSWORD_HISTORY_COUNT,
      });

      // Check if new password matches any recent password
      for (const record of history) {
        const matches = await bcrypt.compare(newPassword, record.passwordHash);
        if (matches) {
          return true; // Password was used recently
        }
      }

      return false; // Password is new
    } catch (error) {
      console.error('Error checking password history:', error);
      return false; // Allow password change if check fails
    }
  }

  /**
   * Save password to history
   */
  async savePasswordToHistory(userId: number, passwordHash: string): Promise<void> {
    try {
      // Add new password to history
      await prisma.passwordHistory.create({
        data: {
          userId,
          passwordHash,
        },
      });

      // Keep only the last N passwords
      const allHistory = await prisma.passwordHistory.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      });

      // Delete old passwords beyond the limit
      if (allHistory.length > PASSWORD_HISTORY_COUNT) {
        const toDelete = allHistory.slice(PASSWORD_HISTORY_COUNT);
        await prisma.passwordHistory.deleteMany({
          where: {
            id: {
              in: toDelete.map((h) => h.id),
            },
          },
        });
      }
    } catch (error) {
      console.error('Error saving password to history:', error);
      // Don't throw - password change should succeed even if history fails
    }
  }

  /**
   * Validate password for reset (includes strength and history checks)
   */
  async validatePasswordForReset(userId: number, newPassword: string): Promise<PasswordValidationResult> {
    const errors: string[] = [];

    // Check password strength
    const strength = this.validatePasswordStrength(newPassword);
    if (!strength.isValid) {
      errors.push(...strength.feedback);
    }

    // Check password history
    const wasUsedRecently = await this.checkPasswordHistory(userId, newPassword);
    if (wasUsedRecently) {
      errors.push(`No puedes reutilizar una de tus últimas ${PASSWORD_HISTORY_COUNT} contraseñas`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      strength,
    };
  }

  /**
   * Record login attempt
   */
  async recordLoginAttempt(
    email: string,
    userId: number | null,
    successful: boolean,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<void> {
    try {
      await prisma.loginAttempt.create({
        data: {
          email: email.toLowerCase(),
          userId,
          successful,
          ipAddress,
          userAgent,
        },
      });
    } catch (error) {
      console.error('Error recording login attempt:', error);
    }
  }

  /**
   * Check if account is locked
   */
  async isAccountLocked(userId: number): Promise<{ locked: boolean; lockedUntil?: Date }> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { lockedUntil: true },
      });

      if (!user?.lockedUntil) {
        return { locked: false };
      }

      const now = new Date();
      if (user.lockedUntil > now) {
        return { locked: true, lockedUntil: user.lockedUntil };
      }

      // Lock expired, clear it
      await this.unlockAccount(userId);
      return { locked: false };
    } catch (error) {
      console.error('Error checking account lock:', error);
      return { locked: false };
    }
  }

  /**
   * Lock account after too many failed attempts
   */
  async lockAccount(userId: number): Promise<Date> {
    const lockedUntil = new Date();
    lockedUntil.setMinutes(lockedUntil.getMinutes() + LOCKOUT_DURATION_MINUTES);

    await prisma.user.update({
      where: { id: userId },
      data: {
        lockedUntil,
        failedLoginAttempts: 0, // Reset counter
      },
    });

    return lockedUntil;
  }

  /**
   * Unlock account
   */
  async unlockAccount(userId: number): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: {
        lockedUntil: null,
        failedLoginAttempts: 0,
      },
    });
  }

  /**
   * Increment failed login attempts and lock if necessary
   */
  async handleFailedLogin(userId: number): Promise<{ locked: boolean; lockedUntil?: Date; attemptsRemaining: number }> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { failedLoginAttempts: true },
      });

      if (!user) {
        return { locked: false, attemptsRemaining: MAX_FAILED_ATTEMPTS };
      }

      const newAttempts = user.failedLoginAttempts + 1;

      if (newAttempts >= MAX_FAILED_ATTEMPTS) {
        const lockedUntil = await this.lockAccount(userId);
        return { locked: true, lockedUntil, attemptsRemaining: 0 };
      }

      await prisma.user.update({
        where: { id: userId },
        data: { failedLoginAttempts: newAttempts },
      });

      return {
        locked: false,
        attemptsRemaining: MAX_FAILED_ATTEMPTS - newAttempts,
      };
    } catch (error) {
      console.error('Error handling failed login:', error);
      return { locked: false, attemptsRemaining: MAX_FAILED_ATTEMPTS };
    }
  }

  /**
   * Reset failed login attempts on successful login
   */
  async resetFailedLoginAttempts(userId: number): Promise<void> {
    try {
      await prisma.user.update({
        where: { id: userId },
        data: { failedLoginAttempts: 0 },
      });
    } catch (error) {
      console.error('Error resetting failed login attempts:', error);
    }
  }

  /**
   * Get recent failed login attempts for an email
   */
  async getRecentFailedAttempts(email: string, minutes: number = 60): Promise<number> {
    try {
      const since = new Date();
      since.setMinutes(since.getMinutes() - minutes);

      const count = await prisma.loginAttempt.count({
        where: {
          email: email.toLowerCase(),
          successful: false,
          createdAt: {
            gte: since,
          },
        },
      });

      return count;
    } catch (error) {
      console.error('Error getting recent failed attempts:', error);
      return 0;
    }
  }
}

export default new PasswordValidationService();
