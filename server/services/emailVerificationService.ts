import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

// Verification code expires in 10 minutes
const VERIFICATION_CODE_EXPIRY_MINUTES = 10;
const MAX_VERIFICATION_ATTEMPTS = 5;

class EmailVerificationService {
  /**
   * Generate a 6-digit verification code
   */
  private generateVerificationCode(): string {
    return crypto.randomInt(100000, 999999).toString();
  }

  /**
   * Create a new verification code for an email
   * Invalidates any previous codes for the same email
   */
  async createVerificationCode(email: string): Promise<string> {
    // Invalidate any existing verification codes for this email
    await prisma.emailVerification.updateMany({
      where: {
        email,
        verified: false,
      },
      data: {
        verified: true, // Mark as verified to effectively invalidate them
      },
    });

    // Generate new code
    const code = this.generateVerificationCode();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + VERIFICATION_CODE_EXPIRY_MINUTES);

    // Create verification record
    await prisma.emailVerification.create({
      data: {
        email,
        code,
        expiresAt,
      },
    });

    return code;
  }

  /**
   * Verify a code for an email
   * Returns true if valid, false otherwise
   */
  async verifyCode(email: string, code: string): Promise<{ success: boolean; message: string }> {
    // Find the most recent unverified code for this email
    const verification = await prisma.emailVerification.findFirst({
      where: {
        email,
        code,
        verified: false,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (!verification) {
      return {
        success: false,
        message: 'Código de verificación inválido',
      };
    }

    // Check if code has expired
    if (new Date() > verification.expiresAt) {
      return {
        success: false,
        message: 'El código de verificación ha expirado. Solicita uno nuevo.',
      };
    }

    // Check if max attempts exceeded
    if (verification.attempts >= MAX_VERIFICATION_ATTEMPTS) {
      return {
        success: false,
        message: 'Demasiados intentos fallidos. Solicita un nuevo código.',
      };
    }

    // Increment attempts
    await prisma.emailVerification.update({
      where: { id: verification.id },
      data: {
        attempts: verification.attempts + 1,
      },
    });

    // Mark as verified
    await prisma.emailVerification.update({
      where: { id: verification.id },
      data: {
        verified: true,
      },
    });

    return {
      success: true,
      message: 'Correo verificado exitosamente',
    };
  }

  /**
   * Check if an email has been verified recently (within last 30 minutes)
   * Used to prevent requiring re-verification during signup flow
   */
  async isEmailRecentlyVerified(email: string): Promise<boolean> {
    const thirtyMinutesAgo = new Date();
    thirtyMinutesAgo.setMinutes(thirtyMinutesAgo.getMinutes() - 30);

    const verification = await prisma.emailVerification.findFirst({
      where: {
        email,
        verified: true,
        createdAt: {
          gte: thirtyMinutesAgo,
        },
      },
    });

    return !!verification;
  }

  /**
   * Clean up expired verification codes (older than 24 hours)
   */
  async cleanupExpiredCodes(): Promise<void> {
    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

    await prisma.emailVerification.deleteMany({
      where: {
        createdAt: {
          lt: twentyFourHoursAgo,
        },
      },
    });

    console.log('Expired verification codes cleaned up');
  }
}

export default new EmailVerificationService();
