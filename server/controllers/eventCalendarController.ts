import { Request, Response } from 'express';
import eventCalendarService, { EMAIL_EVENT_ACTIONS, isEventActionKey } from '../services/eventCalendarService.js';
import emailService from '../services/emailService.js';

const parseParams = (req: Request) => {
  const giftListId = Number(req.params.giftListId);
  const { action } = req.params;
  if (!Number.isInteger(giftListId)) return { error: 'Invalid gift list id' } as const;
  if (!isEventActionKey(action)) return { error: 'Invalid action' } as const;
  return { giftListId, action } as const;
};

export default {
  /**
   * All gift lists with their event date, collected money and logged actions
   * GET /api/admin/event-calendar
   */
  getCalendar: async (_req: Request, res: Response) => {
    try {
      const events = await eventCalendarService.getCalendarEvents();
      res.json(events);
    } catch (error) {
      console.error('Error fetching event calendar:', error);
      res.status(500).json({ error: 'Failed to fetch event calendar' });
    }
  },

  /**
   * Mark an action as done or skipped (upsert)
   * PUT /api/admin/event-calendar/:giftListId/actions/:action
   */
  logAction: async (req: Request, res: Response) => {
    try {
      const params = parseParams(req);
      if ('error' in params) return res.status(400).json({ error: params.error });

      const { status = 'DONE', note } = req.body ?? {};
      if (status !== 'DONE' && status !== 'SKIPPED') {
        return res.status(400).json({ error: 'status must be DONE or SKIPPED' });
      }
      if (note !== undefined && note !== null && typeof note !== 'string') {
        return res.status(400).json({ error: 'note must be a string' });
      }

      if (!(await eventCalendarService.getGiftListOwner(params.giftListId))) {
        return res.status(404).json({ error: 'Gift list not found' });
      }

      const logged = await eventCalendarService.logAction({
        ...params,
        status,
        note: note?.trim() || null,
        adminUserId: req.user?.userId,
      });
      res.json(logged);
    } catch (error) {
      console.error('Error logging event action:', error);
      res.status(500).json({ error: 'Failed to log event action' });
    }
  },

  /**
   * Undo a logged action so it shows as pending again
   * DELETE /api/admin/event-calendar/:giftListId/actions/:action
   */
  clearAction: async (req: Request, res: Response) => {
    try {
      const params = parseParams(req);
      if ('error' in params) return res.status(400).json({ error: params.error });

      await eventCalendarService.clearAction(params.giftListId, params.action);
      res.status(204).send();
    } catch (error) {
      console.error('Error clearing event action:', error);
      res.status(500).json({ error: 'Failed to clear event action' });
    }
  },

  /**
   * Send the email behind an email action to the list's owner, then log it as done
   * POST /api/admin/event-calendar/:giftListId/actions/:action/send
   */
  sendActionEmail: async (req: Request, res: Response) => {
    try {
      const params = parseParams(req);
      if ('error' in params) return res.status(400).json({ error: params.error });

      const emailType = EMAIL_EVENT_ACTIONS[params.action];
      if (!emailType) {
        return res.status(400).json({ error: 'This action does not send an email' });
      }

      const owner = await eventCalendarService.getGiftListOwner(params.giftListId);
      if (!owner) return res.status(404).json({ error: 'Gift list not found' });

      if (!process.env.POSTMARK_API_KEY) {
        // emailService silently no-ops without Postmark; don't record a send that never happened.
        return res.status(503).json({ error: 'Email is not configured on this server' });
      }

      await emailService.sendBankInfoRequestEmail(owner.userId);

      const logged = await eventCalendarService.logAction({
        ...params,
        status: 'DONE',
        note: 'Enviado desde el calendario',
        adminUserId: req.user?.userId,
      });
      res.json(logged);
    } catch (error) {
      console.error('Error sending event action email:', error);
      res.status(500).json({ error: 'Failed to send email' });
    }
  },
};
