import { Request, Response, NextFunction } from 'express';
import { SessionService, SessionData } from '../lib/sessionService.js';

// Interface for user data attached to request
interface AuthenticatedUser {
  userId: number;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

// Extend Express Request interface to include user and session
declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
      session?: SessionData;
    }
  }
}

// Cookie configuration
export const COOKIE_CONFIG = {
  name: 'session_token',
  options: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production', // HTTPS only in production
    sameSite: 'strict' as const,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
    path: '/',
    domain: process.env.NODE_ENV === 'production' ? '.mesalista.com.mx' : undefined, // Share cookie across subdomains in production
  },
};

// Middleware to authenticate session token from cookies
export const authenticateSession = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Get token from cookie
    const token = req.cookies[COOKIE_CONFIG.name];

    if (!token) {
      return res.status(401).json({ error: 'Access denied. No session token provided.' });
    }

    // Validate session
    const session = await SessionService.validateSession(token);

    if (!session) {
      // Clear invalid cookie
      res.clearCookie(COOKIE_CONFIG.name, COOKIE_CONFIG.options);
      return res.status(401).json({ error: 'Invalid or expired session.' });
    }

    // Attach user and session data to request
    req.user = {
      userId: session.user.id,
      email: session.user.email,
      firstName: session.user.firstName,
      lastName: session.user.lastName,
      role: session.user.role,
    };
    req.session = session;

    next();
  } catch (error) {
    console.error('Session authentication error:', error);
    return res.status(500).json({ error: 'Authentication failed.' });
  }
};

// Optional middleware that doesn't require authentication but adds user info if session exists
export const optionalAuthenticateSession = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.cookies[COOKIE_CONFIG.name];

    if (token) {
      const session = await SessionService.validateSession(token);

      if (session) {
        req.user = {
          userId: session.user.id,
          email: session.user.email,
          firstName: session.user.firstName,
          lastName: session.user.lastName,
          role: session.user.role,
        };
        req.session = session;
      } else {
        // Clear invalid cookie
        res.clearCookie(COOKIE_CONFIG.name, COOKIE_CONFIG.options);
      }
    }

    next();
  } catch (error) {
    console.warn('Optional session authentication error:', error);
    // Don't return error for optional auth, just continue without user
    next();
  }
};

// Utility function to create session and set cookie
export const createSessionAndSetCookie = async (
  res: Response,
  userId: number,
  userAgent: string,
  ipAddress?: string,
): Promise<SessionData> => {
  try {
    const session = await SessionService.createSession({
      userId,
      userAgent,
      ipAddress,
    });

    // Set secure HttpOnly cookie
    res.cookie(COOKIE_CONFIG.name, session.token, COOKIE_CONFIG.options);

    return session;
  } catch (error) {
    console.error('Error creating session:', error);
    throw new Error('Failed to create session');
  }
};

// Middleware to require admin role (must be used after authenticateSession)
export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required.' });
  }

  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Access denied. Admin privileges required.' });
  }

  next();
};

// Utility function to logout (clear session and cookie)
export const logoutSession = async (req: Request, res: Response): Promise<void> => {
  try {
    const token = req.cookies[COOKIE_CONFIG.name];

    if (token) {
      // Invalidate session in database
      await SessionService.invalidateSession(token);
    }

    // Clear cookie
    res.clearCookie(COOKIE_CONFIG.name, COOKIE_CONFIG.options);
  } catch (error) {
    console.error('Error during logout:', error);
    // Still clear cookie even if database operation fails
    res.clearCookie(COOKIE_CONFIG.name, COOKIE_CONFIG.options);
  }
};
