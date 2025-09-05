import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

export interface CreateSessionData {
  userId: number;
  userAgent: string;
  ipAddress?: string | null;
}

export interface SessionData {
  id: string;
  userId: number;
  token: string;
  userAgent: string;
  ipAddress?: string | null;
  expiresAt: Date;
  createdAt: Date;
  user: {
    id: number;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
  };
}

export class SessionService {
  private static readonly SESSION_DURATION_HOURS = 24;

  /**
   * Generate a secure random token
   */
  private static generateToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Create a new session for a user
   * Invalidates any existing sessions for the same user/browser combination
   */
  static async createSession(data: CreateSessionData): Promise<SessionData> {
    const { userId, userAgent, ipAddress } = data;
    
    // Generate new token and expiration
    const token = this.generateToken();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + this.SESSION_DURATION_HOURS);

    // Invalidate existing sessions for this user/browser combination
    await this.invalidateUserSessions(userId, userAgent);

    // Create new session
    const session = await prisma.session.create({
      data: {
        userId,
        token,
        userAgent,
        ipAddress,
        expiresAt,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
      },
    });

    return session;
  }

  /**
   * Validate a session token and return session data if valid
   */
  static async validateSession(token: string): Promise<SessionData | null> {
    if (!token) {
      return null;
    }

    try {
      const session = await prisma.session.findUnique({
        where: { token },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              role: true,
            },
          },
        },
      });

      if (!session) {
        return null;
      }

      // Check if session has expired
      if (session.expiresAt < new Date()) {
        // Clean up expired session
        await this.invalidateSession(token);
        return null;
      }

      return session;
    } catch (error) {
      console.error('Error validating session:', error);
      return null;
    }
  }

  /**
   * Invalidate a specific session
   */
  static async invalidateSession(token: string): Promise<void> {
    try {
      await prisma.session.delete({
        where: { token },
      });
    } catch (error) {
      // Session might already be deleted, ignore error
      console.log('Session already deleted or not found:', token);
    }
  }

  /**
   * Invalidate all sessions for a user (except optionally one to keep)
   */
  static async invalidateUserSessions(userId: number, userAgent?: string): Promise<void> {
    try {
      const whereClause: any = { userId };
      
      // If userAgent is provided, only invalidate sessions from the same browser
      if (userAgent) {
        whereClause.userAgent = userAgent;
      }

      await prisma.session.deleteMany({
        where: whereClause,
      });
    } catch (error) {
      console.error('Error invalidating user sessions:', error);
    }
  }

  /**
   * Clean up all expired sessions (for background cleanup job)
   */
  static async cleanupExpiredSessions(): Promise<number> {
    try {
      const result = await prisma.session.deleteMany({
        where: {
          expiresAt: {
            lt: new Date(),
          },
        },
      });

      console.log(`Cleaned up ${result.count} expired sessions`);
      return result.count;
    } catch (error) {
      console.error('Error cleaning up expired sessions:', error);
      return 0;
    }
  }

  /**
   * Get all active sessions for a user
   */
  static async getUserSessions(userId: number): Promise<SessionData[]> {
    try {
      const sessions = await prisma.session.findMany({
        where: {
          userId,
          expiresAt: {
            gt: new Date(),
          },
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              role: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      return sessions;
    } catch (error) {
      console.error('Error getting user sessions:', error);
      return [];
    }
  }

  /**
   * Refresh a session (extend expiration)
   */
  static async refreshSession(token: string): Promise<SessionData | null> {
    try {
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + this.SESSION_DURATION_HOURS);

      const session = await prisma.session.update({
        where: { token },
        data: { expiresAt },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              role: true,
            },
          },
        },
      });

      return session;
    } catch (error) {
      console.error('Error refreshing session:', error);
      return null;
    }
  }
}
