import { Request, Response, NextFunction } from 'express';

/**
 * Middleware to authenticate cron job requests
 * Checks for Bearer token in Authorization header or admin session cookie
 */
export const authenticateCron = (req: Request, res: Response, next: NextFunction) => {
  // Check for Bearer token (for GitHub Actions / external cron)
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    const cronToken = process.env.ANALYTICS_CRON_TOKEN;

    if (!cronToken) {
      console.warn('⚠️ ANALYTICS_CRON_TOKEN not set in environment variables');
      return res.status(500).json({ error: 'Cron authentication not configured' });
    }

    if (token === cronToken) {
      return next();
    }

    return res.status(401).json({ error: 'Invalid cron token' });
  }

  // If no Bearer token, check if user is authenticated admin (for manual triggers)
  if (req.user?.role === 'ADMIN') {
    return next();
  }

  return res.status(401).json({ error: 'Unauthorized: Admin access or valid cron token required' });
};
