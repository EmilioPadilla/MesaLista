import { Request, Response } from 'express';
import { invitationService } from '../services/invitationService.js';
import { InvitationStatus } from '@prisma/client';

export const invitationController = {
  /**
   * Get invitation by gift list ID (Public - only returns published invitations)
   * GET /api/invitations/gift-list/:giftListId/public
   */
  async getByGiftListIdPublic(req: Request, res: Response) {
    try {
      const giftListId = parseInt(req.params.giftListId as string);

      if (isNaN(giftListId)) {
        return res.status(400).json({ error: 'Invalid gift list ID' });
      }

      const invitation = await invitationService.getByGiftListId(giftListId);

      // Only return published invitations for public access
      if (!invitation || invitation.status !== InvitationStatus.PUBLISHED) {
        return res.status(404).json({ error: 'Invitation not found or not published' });
      }

      res.json(invitation);
    } catch (error) {
      console.error('Error fetching public invitation by gift list ID:', error);
      res.status(500).json({ error: 'Failed to fetch invitation' });
    }
  },

  /**
   * Get invitation by gift list ID (Protected)
   * GET /api/invitations/gift-list/:giftListId
   */
  async getByGiftListId(req: Request, res: Response) {
    try {
      const giftListId = parseInt(req.params.giftListId as string);

      if (isNaN(giftListId)) {
        return res.status(400).json({ error: 'Invalid gift list ID' });
      }

      const invitation = await invitationService.getByGiftListId(giftListId);

      // Return 200 with null if invitation doesn't exist (not an error)
      res.json(invitation || null);
    } catch (error) {
      console.error('Error fetching invitation by gift list ID:', error);
      res.status(500).json({ error: 'Failed to fetch invitation' });
    }
  },

  /**
   * Create a new invitation
   * POST /api/invitations
   */
  async create(req: Request, res: Response) {
    try {
      const { giftListId, templateId, eventName, htmlContent, formData, customColors } = req.body;

      // Validate required fields
      if (!giftListId || !templateId || !eventName || !htmlContent || !formData) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const invitation = await invitationService.create({
        giftListId,
        templateId,
        eventName,
        htmlContent,
        formData,
        customColors,
      });

      res.status(201).json(invitation);
    } catch (error: any) {
      console.error('Error creating invitation:', error);

      // Check for unique constraint violation (gift list already has invitation)
      if (error.code === 'P2002') {
        return res.status(409).json({ error: 'This gift list already has an invitation' });
      }

      res.status(500).json({ error: 'Failed to create invitation' });
    }
  },

  /**
   * Update an invitation
   * PUT /api/invitations/:id
   */
  async update(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id as string);
      const { eventName, htmlContent, formData, customColors, status } = req.body;

      if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid invitation ID' });
      }

      // Validate status if provided
      if (status && !Object.values(InvitationStatus).includes(status)) {
        return res.status(400).json({ error: 'Invalid status value' });
      }

      const invitation = await invitationService.update(id, {
        eventName,
        htmlContent,
        formData,
        customColors,
        status,
      });

      res.json(invitation);
    } catch (error: any) {
      console.error('Error updating invitation:', error);

      if (error.code === 'P2025') {
        return res.status(404).json({ error: 'Invitation not found' });
      }

      res.status(500).json({ error: 'Failed to update invitation' });
    }
  },

  /**
   * Publish an invitation
   * POST /api/invitations/:id/publish
   */
  async publish(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id as string);

      if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid invitation ID' });
      }

      const invitation = await invitationService.publish(id);

      res.json(invitation);
    } catch (error: any) {
      console.error('Error publishing invitation:', error);

      if (error.code === 'P2025') {
        return res.status(404).json({ error: 'Invitation not found' });
      }

      res.status(500).json({ error: 'Failed to publish invitation' });
    }
  },

  /**
   * Delete an invitation
   * DELETE /api/invitations/:id
   */
  async delete(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id as string);

      if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid invitation ID' });
      }

      await invitationService.delete(id);

      res.json({ message: 'Invitation deleted successfully' });
    } catch (error: any) {
      console.error('Error deleting invitation:', error);

      if (error.code === 'P2025') {
        return res.status(404).json({ error: 'Invitation not found' });
      }

      res.status(500).json({ error: 'Failed to delete invitation' });
    }
  },
};
