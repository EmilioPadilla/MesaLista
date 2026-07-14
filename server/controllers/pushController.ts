import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { Expo } from 'expo-server-sdk';

const prisma = new PrismaClient();

export default {
  /**
   * Register (upsert) an Expo push token for the authenticated user's device.
   * Requires authenticateSession — req.user is guaranteed.
   */
  registerToken: async (req: Request, res: Response) => {
    try {
      const userId = req.user!.userId;
      const { token, platform, deviceId } = req.body as {
        token?: string;
        platform?: string;
        deviceId?: string;
      };

      if (!token || !Expo.isExpoPushToken(token)) {
        return res.status(400).json({ success: false, message: 'A valid Expo push token is required.' });
      }

      // Upsert on the unique token. If the token moved to a different user
      // (device handed off / re-login), reassign it to the current user.
      await prisma.pushToken.upsert({
        where: { token },
        create: { token, userId, platform: platform || 'ios', deviceId: deviceId || null },
        update: { userId, platform: platform || 'ios', deviceId: deviceId || null },
      });

      return res.json({ success: true });
    } catch (error) {
      console.error('Error registering push token:', error);
      return res.status(500).json({ success: false, message: 'Failed to register push token.' });
    }
  },

  /**
   * Unregister an Expo push token (called on logout). Scoped to the current user.
   */
  unregisterToken: async (req: Request, res: Response) => {
    try {
      const userId = req.user!.userId;
      const { token } = req.body as { token?: string };

      if (!token) {
        return res.status(400).json({ success: false, message: 'A push token is required.' });
      }

      await prisma.pushToken.deleteMany({ where: { token, userId } });

      return res.json({ success: true });
    } catch (error) {
      console.error('Error unregistering push token:', error);
      return res.status(500).json({ success: false, message: 'Failed to unregister push token.' });
    }
  },
};
