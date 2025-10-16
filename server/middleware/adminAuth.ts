import { Request, Response, NextFunction } from 'express';

/**
 * Middleware to check if user is an admin
 * Must be used after authenticateSession middleware
 */
export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  next();
};

export default requireAdmin;
