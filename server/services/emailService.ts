import postmark from 'postmark';
import { PrismaClient } from '@prisma/client';
import { EmailTemplates } from '../templates/emailTemplates.js';

const prisma = new PrismaClient();

// Configure Postmark
const POSTMARK_API_KEY = process.env.POSTMARK_API_KEY || '';
const FROM_EMAIL = process.env.BUSINESS_EMAIL || 'info@mesalista.com.mx';
const ADMIN_RECIPIENT_EMAIL = process.env.BUSINESS_EMAIL || 'info@mesalista.com.mx';

// Initialize Postmark client
const postmarkClient = POSTMARK_API_KEY ? new postmark.ServerClient(POSTMARK_API_KEY) : null;

export interface PaymentEmailData {
  cartId: number;
  paymentId: string;
  amount: number;
  currency: string;
  paymentType: 'STRIPE' | 'PAYPAL';
  guestName: string;
  guestEmail: string;
  guestPhone?: string;
  message?: string;
  items: Array<{
    giftTitle: string;
    giftDescription?: string;
    quantity: number;
    price: number;
    imageUrl?: string;
  }>;
  coupleInfo: {
    coupleName: string;
    firstName: string;
    lastName: string;
    spouseFirstName?: string;
    spouseLastName?: string;
    email: string;
    weddingDate: Date;
    weddingLocation?: string;
  };
}

class EmailService {
  /**
   * Send payment confirmation email to the guest who made the payment
   */
  async sendPaymentConfirmationToGuest(data: PaymentEmailData): Promise<void> {
    if (!postmarkClient) {
      console.warn('Postmark API key not configured. Skipping email.');
      return;
    }

    const totalAmount = data.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const itemsCount = data.items.reduce((sum, item) => sum + item.quantity, 0);

    try {
      await postmarkClient.sendEmail({
        From: FROM_EMAIL,
        To: data.guestEmail,
        Subject: `¡Confirmación de pago! - Regalo para ${data.coupleInfo.coupleName}`,
        HtmlBody: EmailTemplates.generateGuestConfirmationEmailHTML(data, totalAmount, itemsCount),
        TextBody: EmailTemplates.generateGuestConfirmationEmailText(data, totalAmount, itemsCount),
        MessageStream: 'outbound',
      });
      console.log(`Payment confirmation email sent to guest: ${data.guestEmail}`);
    } catch (error) {
      console.error('Error sending payment confirmation email to guest:', error);
      throw error;
    }
  }

  /**
   * Send payment notification email to the couple (registry owner)
   */
  async sendPaymentNotificationToOwner(data: PaymentEmailData): Promise<void> {
    if (!postmarkClient) {
      console.warn('Postmark API key not configured. Skipping email.');
      return;
    }

    const totalAmount = data.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const itemsCount = data.items.reduce((sum, item) => sum + item.quantity, 0);

    try {
      await postmarkClient.sendEmail({
        From: FROM_EMAIL,
        To: data.coupleInfo.email,
        Subject: `¡Nuevo regalo recibido! - ${data.guestName} te ha enviado un regalo`,
        HtmlBody: EmailTemplates.generateOwnerNotificationEmailHTML(data, totalAmount, itemsCount),
        TextBody: EmailTemplates.generateOwnerNotificationEmailText(data, totalAmount, itemsCount),
        MessageStream: 'outbound',
      });
      console.log(`Payment notification email sent to owner: ${data.coupleInfo.email}`);
    } catch (error) {
      console.error('Error sending payment notification email to owner:', error);
      throw error;
    }
  }

  /**
   * Get payment email data from database
   * Extracts and formats payment data for email sending
   */
  async getPaymentEmailData(cartId: number): Promise<PaymentEmailData> {
    try {
      // Get cart with all related data
      const cart = await prisma.cart.findUnique({
        where: { id: cartId },
        include: {
          items: {
            include: {
              gift: {
                include: {
                  giftList: {
                    include: {
                      user: true,
                    },
                  },
                },
              },
            },
          },
          payment: true,
        },
      });

      if (!cart || !cart.payment) {
        throw new Error(`Cart or payment not found for cartId: ${cartId}`);
      }

      if (!cart.items.length) {
        throw new Error(`No items found in cart: ${cartId}`);
      }

      // Get couple info from the first item's gift list
      const firstItem = cart.items[0];
      const giftList = firstItem.gift.giftList;
      const user = giftList.user;

      const emailData: PaymentEmailData = {
        cartId: cart.id,
        paymentId: cart.payment.paymentId,
        amount: cart.payment.amount,
        currency: cart.payment.currency,
        paymentType: cart.payment.paymentType as 'STRIPE' | 'PAYPAL',
        guestName: cart.inviteeName || 'Invitado',
        guestEmail: cart.inviteeEmail || '',
        guestPhone: cart.phoneNumber || undefined,
        message: cart.message || undefined,
        items: cart.items.map((item) => ({
          giftTitle: item.gift.title,
          giftDescription: item.gift.description || undefined,
          quantity: item.quantity,
          price: item.price,
          imageUrl: item.gift.imageUrl || undefined,
        })),
        coupleInfo: {
          coupleName: giftList.coupleName,
          firstName: user.firstName,
          lastName: user.lastName,
          spouseFirstName: user.spouseFirstName || undefined,
          spouseLastName: user.spouseLastName || undefined,
          email: user.email,
          weddingDate: giftList.eventDate,
          weddingLocation: giftList.eventLocation || undefined,
        },
      };

      return emailData;
    } catch (error) {
      console.error('Error getting payment email data:', error);
      throw error;
    }
  }

  /**
   * Get payment data from database and send both emails
   */
  async sendPaymentEmails(cartId: number): Promise<void> {
    try {
      const emailData = await this.getPaymentEmailData(cartId);

      // Send both emails
      const promises = [];

      if (emailData.guestEmail) {
        promises.push(this.sendPaymentConfirmationToGuest(emailData));
      }

      promises.push(this.sendPaymentNotificationToOwner(emailData));

      await Promise.all(promises);

      console.log(`Payment emails sent successfully for cart: ${cartId}`);
    } catch (error) {
      console.error('Error sending payment emails:', error);
      throw error;
    }
  }

  /**
   * Send inactive user warning email
   */
  async sendInactiveUserWarning(userId: number): Promise<void> {
    if (!postmarkClient) {
      console.warn('Postmark API key not configured. Skipping email.');
      return;
    }

    try {
      // Get user and gift list data
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          giftLists: {
            include: {
              gifts: true,
            },
          },
        },
      });

      if (!user) {
        throw new Error(`User not found: ${userId}`);
      }

      const giftList = user.giftLists[0];
      const firstName = user.firstName;
      const coupleName = giftList?.coupleName || `${user.firstName} ${user.lastName}`;
      const giftCount = giftList?.gifts.length || 0;

      await postmarkClient.sendEmail({
        From: FROM_EMAIL,
        To: user.email,
        Subject: '¡Tu mesa de regalos te está esperando! - MesaLista',
        HtmlBody: EmailTemplates.generateInactiveUserWarningHTML(firstName, coupleName, giftCount),
        TextBody: EmailTemplates.generateInactiveUserWarningText(firstName, coupleName, giftCount),
        MessageStream: 'outbound',
      });
      console.log(`Inactive user warning email sent to: ${user.email}`);
    } catch (error) {
      console.error('Error sending inactive user warning email:', error);
      throw error;
    }
  }

  /**
   * Send email verification code
   */
  async sendVerificationCodeEmail(email: string, code: string): Promise<void> {
    if (!postmarkClient) {
      console.warn('Postmark API key not configured. Skipping email.');
      return;
    }

    try {
      await postmarkClient.sendEmail({
        From: FROM_EMAIL,
        To: email,
        Subject: 'Código de verificación - MesaLista',
        HtmlBody: EmailTemplates.generateVerificationCodeEmailHTML(email, code),
        TextBody: EmailTemplates.generateVerificationCodeEmailText(email, code),
        MessageStream: 'outbound',
      });
      console.log(`Verification code email sent to: ${email}`);
    } catch (error) {
      console.error('Error sending verification code email:', error);
      throw error;
    }
  }

  /**
   * Send contact form email to admin
   */
  async sendContactFormEmail(data: { name: string; email: string; phone?: string; subject: string; message: string }): Promise<void> {
    if (!postmarkClient) {
      console.warn('Postmark API key not configured. Skipping email.');
      return;
    }

    const subjectMap: Record<string, string> = {
      'crear-lista': 'Crear lista de regalos',
      'comprar-regalo': 'Comprar un regalo',
      'problema-tecnico': 'Problema técnico',
      'facturacion': 'Facturación',
      'sugerencia': 'Sugerencia',
      'otro': 'Otro',
    };

    const subjectText = subjectMap[data.subject] || data.subject;

    try {
      // Send both emails using Postmark batch API
      await postmarkClient.sendEmailBatch([
        {
          From: FROM_EMAIL,
          To: ADMIN_RECIPIENT_EMAIL,
          Subject: `[Contacto MesaLista] ${subjectText} - ${data.name}`,
          HtmlBody: EmailTemplates.generateContactFormAdminEmailHTML(data),
          TextBody: EmailTemplates.generateContactFormAdminEmailText(data),
          MessageStream: 'outbound',
        },
        {
          From: FROM_EMAIL,
          To: data.email,
          Subject: 'Hemos recibido tu mensaje - MesaLista',
          HtmlBody: EmailTemplates.generateContactFormUserEmailHTML(data),
          TextBody: EmailTemplates.generateContactFormUserEmailText(data),
          MessageStream: 'outbound',
        },
      ]);
      console.log(`Contact form email sent from: ${data.email}`);
    } catch (error) {
      console.error('Error sending contact form email:', error);
      throw error;
    }
  }

  /**
   * Send gift list creation confirmation email
   */
  async sendGiftListCreationEmail(data: {
    userId: number;
    giftListId: number;
    giftListTitle: string;
    coupleName: string;
    eventDate: Date;
    planType: string;
    amount: number;
  }): Promise<void> {
    if (!postmarkClient) {
      console.warn('Postmark API key not configured. Skipping email.');
      return;
    }

    try {
      // Get user email
      const user = await prisma.user.findUnique({
        where: { id: data.userId },
        select: {
          email: true,
          firstName: true,
          lastName: true,
          slug: true,
        },
      });

      if (!user || !user.email) {
        console.error('User not found or email missing');
        return;
      }

      const userName = `${user.firstName} ${user.lastName}`;
      const baseUrl = process.env.FRONTEND_URL || 'https://mesalista.com.mx';
      const dashboardUrl = `${baseUrl}/${user.slug}/colecciones`;
      const listUrl = `${baseUrl}/${user.slug}/regalos?listId=${data.giftListId}`;

      const emailData = {
        userName,
        userEmail: user.email,
        giftListTitle: data.giftListTitle,
        coupleName: data.coupleName,
        eventDate: data.eventDate,
        planType: data.planType,
        amount: data.amount,
        dashboardUrl,
        listUrl,
      };

      await postmarkClient.sendEmail({
        From: FROM_EMAIL,
        To: user.email,
        Subject: '¡Tu Nueva Lista de Regalos Está Lista! 🎉',
        HtmlBody: EmailTemplates.generateGiftListCreationEmailHTML(emailData),
        TextBody: EmailTemplates.generateGiftListCreationEmailText(emailData),
        MessageStream: 'outbound',
      });

      console.log(`Gift list creation email sent to: ${user.email}`);
    } catch (error) {
      console.error('Error sending gift list creation email:', error);
      throw error;
    }
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(email: string, firstName: string, resetLink: string): Promise<void> {
    if (!postmarkClient) {
      console.warn('Postmark API key not configured. Skipping email.');
      return;
    }

    try {
      await postmarkClient.sendEmail({
        From: FROM_EMAIL,
        To: email,
        Subject: 'Restablecer contraseña - MesaLista',
        HtmlBody: EmailTemplates.generatePasswordResetEmailHTML(firstName, resetLink),
        TextBody: EmailTemplates.generatePasswordResetEmailText(firstName, resetLink),
        MessageStream: 'outbound',
      });
      console.log(`Password reset email sent to: ${email}`);
    } catch (error) {
      console.error('Error sending password reset email:', error);
      throw error;
    }
  }

  /**
   * Send admin notification email when a new user signs up
   */
  async sendAdminSignupNotification(data: {
    firstName: string;
    lastName: string;
    spouseFirstName?: string;
    spouseLastName?: string;
    email: string;
    phoneNumber?: string;
    slug: string;
    planType: 'FIXED' | 'COMMISSION';
    discountCode?: string;
    createdAt: Date;
  }): Promise<void> {
    if (!postmarkClient) {
      console.warn('Postmark API key not configured. Skipping email.');
      return;
    }

    const coupleName = `${data.firstName}${data.spouseFirstName ? ' y ' + data.spouseFirstName : ''}`;

    try {
      // Get all admin users to send notification
      const adminUsers = await prisma.user.findMany({
        where: { role: 'ADMIN' },
        select: { email: true },
      });

      if (adminUsers.length === 0) {
        console.warn('No admin users found to send signup notification');
        return;
      }

      // Send email to all admins
      const emailPromises = adminUsers.map((admin) =>
        postmarkClient.sendEmail({
          From: FROM_EMAIL,
          To: admin.email,
          Subject: `Nueva cuenta creada - ${coupleName} - MesaLista`,
          HtmlBody: EmailTemplates.generateAdminSignupNotificationEmailHTML(data),
          TextBody: EmailTemplates.generateAdminSignupNotificationEmailText(data),
          MessageStream: 'outbound',
        }),
      );

      await Promise.all(emailPromises);
      console.log(`Admin signup notification sent to ${adminUsers.length} admin(s) for user: ${data.email}`);
    } catch (error) {
      console.error('Error sending admin signup notification:', error);
      // Don't throw error - we don't want to fail user creation if email fails
    }
  }

  /**
   * Send welcome email to new users after successful account creation
   */
  async sendWelcomeEmail(data: {
    email: string;
    firstName: string;
    spouseFirstName?: string;
    slug: string;
    planType: 'FIXED' | 'COMMISSION';
  }): Promise<void> {
    if (!postmarkClient) {
      console.warn('Postmark API key not configured. Skipping email.');
      return;
    }

    const coupleName = `${data.firstName}${data.spouseFirstName ? ' y ' + data.spouseFirstName : ''}`;
    const welcomeMessage = `¡Bienvenid${data.spouseFirstName ? 'os' : '@'} a MesaLista, ${coupleName}! 🎉`;

    try {
      await postmarkClient.sendEmail({
        From: FROM_EMAIL,
        To: data.email,
        Subject: welcomeMessage,
        HtmlBody: EmailTemplates.generateWelcomeEmailHTML(data),
        TextBody: EmailTemplates.generateWelcomeEmailText(data),
        MessageStream: 'outbound',
      });
      console.log(`Welcome email sent to: ${data.email}`);
    } catch (error) {
      console.error('Error sending welcome email:', error);
      // Don't throw error - we don't want to fail user creation if email fails
    }
  }

  /**
   * Send Marketing Email 1: Welcome & Feature Overview
   * Best for: 1-2 days after registration
   */
  async sendMarketingEmail1(userId: number): Promise<void> {
    if (!postmarkClient) {
      console.warn('Postmark API key not configured. Skipping email.');
      return;
    }

    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          email: true,
          firstName: true,
          slug: true,
        },
      });

      if (!user || !user.email || !user.slug) {
        throw new Error('User not found or email/slug missing');
      }

      await postmarkClient.sendEmail({
        From: FROM_EMAIL,
        To: user.email,
        Subject: `¡Hola ${user.firstName}! Bienvenido a MesaLista 👋`,
        HtmlBody: EmailTemplates.generateMarketingEmail1HTML(user.firstName, user.slug),
        TextBody: EmailTemplates.generateMarketingEmail1Text(user.firstName, user.slug),
        MessageStream: 'outbound',
      });

      console.log(`Marketing Email 1 sent to: ${user.email}`);
    } catch (error) {
      console.error('Error sending Marketing Email 1:', error);
      throw error;
    }
  }

  /**
   * Send Marketing Email 2: Quick Start Guide
   * Best for: 3-4 days after registration if no activity
   */
  async sendMarketingEmail2(userId: number): Promise<void> {
    if (!postmarkClient) {
      console.warn('Postmark API key not configured. Skipping email.');
      return;
    }

    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          email: true,
          firstName: true,
          slug: true,
        },
      });

      if (!user || !user.email || !user.slug) {
        throw new Error('User not found or email/slug missing');
      }

      await postmarkClient.sendEmail({
        From: FROM_EMAIL,
        To: user.email,
        Subject: `${user.firstName}, tu mesa de regalos en 3 pasos simples`,
        HtmlBody: EmailTemplates.generateMarketingEmail2HTML(user.firstName, user.slug),
        TextBody: EmailTemplates.generateMarketingEmail2Text(user.firstName, user.slug),
        MessageStream: 'outbound',
      });

      console.log(`Marketing Email 2 sent to: ${user.email}`);
    } catch (error) {
      console.error('Error sending Marketing Email 2:', error);
      throw error;
    }
  }

  /**
   * Send Marketing Email 3: Social Proof & Success Stories
   * Best for: 7 days after registration
   */
  async sendMarketingEmail3(userId: number): Promise<void> {
    if (!postmarkClient) {
      console.warn('Postmark API key not configured. Skipping email.');
      return;
    }

    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          email: true,
          firstName: true,
          slug: true,
        },
      });

      if (!user || !user.email || !user.slug) {
        throw new Error('User not found or email/slug missing');
      }

      await postmarkClient.sendEmail({
        From: FROM_EMAIL,
        To: user.email,
        Subject: `${user.firstName}, mira lo que otras parejas están logrando con MesaLista`,
        HtmlBody: EmailTemplates.generateMarketingEmail3HTML(user.firstName, user.slug),
        TextBody: EmailTemplates.generateMarketingEmail3Text(user.firstName, user.slug),
        MessageStream: 'outbound',
      });

      console.log(`Marketing Email 3 sent to: ${user.email}`);
    } catch (error) {
      console.error('Error sending Marketing Email 3:', error);
      throw error;
    }
  }

  /**
   * Send Marketing Email 4: Re-engagement & Special Offer
   * Best for: 14 days after registration if still inactive
   */
  async sendMarketingEmail4(userId: number): Promise<void> {
    if (!postmarkClient) {
      console.warn('Postmark API key not configured. Skipping email.');
      return;
    }

    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          email: true,
          firstName: true,
          slug: true,
        },
      });

      if (!user || !user.email || !user.slug) {
        throw new Error('User not found or email/slug missing');
      }

      await postmarkClient.sendEmail({
        From: FROM_EMAIL,
        To: user.email,
        Subject: `${user.firstName}, te extrañamos 💜 - Oferta especial dentro`,
        HtmlBody: EmailTemplates.generateMarketingEmail4HTML(user.firstName, user.slug),
        TextBody: EmailTemplates.generateMarketingEmail4Text(user.firstName, user.slug),
        MessageStream: 'outbound',
      });

      console.log(`Marketing Email 4 sent to: ${user.email}`);
    } catch (error) {
      console.error('Error sending Marketing Email 4:', error);
      throw error;
    }
  }

  /**
   * Send marketing emails to users based on plan type
   * Filters users based on planType and sends appropriate email
   * @param emailType - The email campaign type (1-4)
   * @param planTypes - Array of plan types to target (defaults to ['COMMISSION'])
   */
  async sendMarketingEmailToCommissionUsers(
    emailType: 1 | 2 | 3 | 4,
    planTypes: ('COMMISSION' | 'FIXED')[] = ['COMMISSION'],
  ): Promise<{ sent: number; failed: number }> {
    if (!postmarkClient) {
      console.warn('Postmark API key not configured. Skipping email.');
      return { sent: 0, failed: 0 };
    }

    try {
      // Get all users with specified plan types
      const users = await prisma.user.findMany({
        where: {
          role: 'COUPLE',
          giftLists: {
            some: {
              planType: {
                in: planTypes,
              },
            },
          },
        },
        select: {
          id: true,
          email: true,
          firstName: true,
        },
      });

      console.log(`Found ${users.length} users with plan types [${planTypes.join(', ')}] for Marketing Email ${emailType}`);

      let sent = 0;
      let failed = 0;

      // Send emails in batches to avoid overwhelming the email service
      for (const user of users) {
        try {
          switch (emailType) {
            case 1:
              await this.sendMarketingEmail1(user.id);
              break;
            case 2:
              await this.sendMarketingEmail2(user.id);
              break;
            case 3:
              await this.sendMarketingEmail3(user.id);
              break;
            case 4:
              await this.sendMarketingEmail4(user.id);
              break;
          }
          sent++;
        } catch (error) {
          console.error(`Failed to send Marketing Email ${emailType} to user ${user.id}:`, error);
          failed++;
        }
      }

      console.log(`Marketing Email ${emailType} campaign complete: ${sent} sent, ${failed} failed`);
      return { sent, failed };
    } catch (error) {
      console.error('Error sending marketing emails to commission users:', error);
      throw error;
    }
  }

  /**
   * Get list of users with specific plan types for selection
   * @param planTypes - Array of plan types to filter (defaults to ['COMMISSION'])
   */
  async getCommissionUsers(planTypes: ('COMMISSION' | 'FIXED')[] = ['COMMISSION']): Promise<
    Array<{
      id: number;
      email: string;
      firstName: string;
      lastName: string;
      spouseFirstName: string | null;
      spouseLastName: string | null;
      slug: string;
      createdAt: Date;
      giftListCount: number;
      planType: string;
    }>
  > {
    try {
      const users = await prisma.user.findMany({
        where: {
          role: 'COUPLE',
          giftLists: {
            some: {
              planType: {
                in: planTypes,
              },
            },
          },
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          spouseFirstName: true,
          spouseLastName: true,
          slug: true,
          createdAt: true,
          giftLists: {
            where: {
              planType: {
                in: planTypes,
              },
            },
            select: {
              id: true,
              planType: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      return users
        .filter((user) => user.slug !== null)
        .map((user) => ({
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          spouseFirstName: user.spouseFirstName,
          spouseLastName: user.spouseLastName,
          slug: user.slug as string,
          createdAt: user.createdAt,
          giftListCount: user.giftLists.length,
          planType: user.giftLists[0]?.planType || 'COMMISSION',
        }));
    } catch (error) {
      console.error('Error getting users by plan type:', error);
      throw error;
    }
  }

  /**
   * Send marketing email to specific users
   */
  async sendMarketingEmailToSelectedUsers(
    emailType: 1 | 2 | 3 | 4 | 'inactive_warning',
    userIds: number[],
  ): Promise<{ sent: number; failed: number }> {
    if (!postmarkClient) {
      console.warn('Postmark API key not configured. Skipping email.');
      return { sent: 0, failed: 0 };
    }

    try {
      console.log(`Sending Marketing Email ${emailType} to ${userIds.length} selected users`);

      let sent = 0;
      let failed = 0;

      for (const userId of userIds) {
        try {
          switch (emailType) {
            case 1:
              await this.sendMarketingEmail1(userId);
              break;
            case 2:
              await this.sendMarketingEmail2(userId);
              break;
            case 3:
              await this.sendMarketingEmail3(userId);
              break;
            case 4:
              await this.sendMarketingEmail4(userId);
              break;
            case 'inactive_warning':
              await this.sendInactiveUserWarning(userId);
              break;
          }
          sent++;
        } catch (error) {
          console.error(`Failed to send Marketing Email ${emailType} to user ${userId}:`, error);
          failed++;
        }
      }

      console.log(`Marketing Email ${emailType} campaign complete: ${sent} sent, ${failed} failed`);
      return { sent, failed };
    } catch (error) {
      console.error('Error sending marketing emails to selected users:', error);
      throw error;
    }
  }

  /**
   * Send marketing email to a lead (signup email) by email address
   * Uses firstName if available, otherwise generic greeting. Uses generic signup link.
   */
  async sendMarketingEmailToLead(emailType: 1 | 2 | 3 | 4 | 'inactive_warning', email: string, firstName?: string | null): Promise<void> {
    if (!postmarkClient) {
      console.warn('Postmark API key not configured. Skipping email.');
      return;
    }

    const name = firstName || 'amigo/a';
    const genericSlug = 'registro'; // Generic link pointing to signup

    let subject: string;
    let htmlBody: string;
    let textBody: string;

    switch (emailType) {
      case 1:
        subject = `¡Hola ${name}! Bienvenido a MesaLista 👋`;
        htmlBody = EmailTemplates.generateMarketingEmail1HTML(name, genericSlug);
        textBody = EmailTemplates.generateMarketingEmail1Text(name, genericSlug);
        break;
      case 2:
        subject = `${name}, tu mesa de regalos en 3 pasos simples`;
        htmlBody = EmailTemplates.generateMarketingEmail2HTML(name, genericSlug);
        textBody = EmailTemplates.generateMarketingEmail2Text(name, genericSlug);
        break;
      case 3:
        subject = `${name}, mira lo que otras parejas están logrando con MesaLista`;
        htmlBody = EmailTemplates.generateMarketingEmail3HTML(name, genericSlug);
        textBody = EmailTemplates.generateMarketingEmail3Text(name, genericSlug);
        break;
      case 4:
        subject = `${name}, te extrañamos 💜 - Oferta especial dentro`;
        htmlBody = EmailTemplates.generateMarketingEmail4HTML(name, genericSlug);
        textBody = EmailTemplates.generateMarketingEmail4Text(name, genericSlug);
        break;
      case 'inactive_warning':
        subject = `⚠️ ${name}, tu cuenta de MesaLista será cerrada pronto`;
        htmlBody = EmailTemplates.generateInactiveUserWarningHTML(name, 'tu mesa de regalos', 0);
        textBody = EmailTemplates.generateInactiveUserWarningText(name, 'tu mesa de regalos', 0);
        break;
    }

    await postmarkClient.sendEmail({
      From: FROM_EMAIL,
      To: email,
      Subject: subject,
      HtmlBody: htmlBody,
      TextBody: textBody,
      MessageStream: 'outbound',
    });

    console.log(`Marketing Email ${emailType} sent to lead: ${email}`);
  }

  /**
   * Send marketing email to multiple leads by their signup email IDs
   */
  async sendMarketingEmailToLeads(
    emailType: 1 | 2 | 3 | 4 | 'inactive_warning',
    leadEmails: { email: string; firstName?: string | null }[],
  ): Promise<{ sent: number; failed: number }> {
    let sent = 0;
    let failed = 0;

    for (const lead of leadEmails) {
      try {
        await this.sendMarketingEmailToLead(emailType, lead.email, lead.firstName);
        sent++;
      } catch (error) {
        console.error(`Failed to send Marketing Email ${emailType} to lead ${lead.email}:`, error);
        failed++;
      }
    }

    console.log(`Marketing Email ${emailType} to leads complete: ${sent} sent, ${failed} failed`);
    return { sent, failed };
  }

  /**
   * Generate email preview HTML for a specific user and email type
   */
  async getMarketingEmailPreview(
    emailType: 1 | 2 | 3 | 4 | 'inactive_warning',
    userId: number,
  ): Promise<{ html: string; subject: string }> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          firstName: true,
          lastName: true,
          spouseFirstName: true,
          spouseLastName: true,
          slug: true,
        },
      });

      if (!user || !user.slug) {
        throw new Error('User not found or slug missing');
      }

      // For preview purposes, use placeholder values
      const giftCount = 0;
      const coupleName = `${user.firstName} ${user.lastName}${user.spouseFirstName ? ` y ${user.spouseFirstName} ${user.spouseLastName || ''}` : ''}`;

      let html: string;
      let subject: string;

      switch (emailType) {
        case 1:
          html = EmailTemplates.generateMarketingEmail1HTML(user.firstName, user.slug);
          subject = `¡Hola ${user.firstName}! Bienvenido a MesaLista 👋`;
          break;
        case 2:
          html = EmailTemplates.generateMarketingEmail2HTML(user.firstName, user.slug);
          subject = `${user.firstName}, tu mesa de regalos en 3 pasos simples`;
          break;
        case 3:
          html = EmailTemplates.generateMarketingEmail3HTML(user.firstName, user.slug);
          subject = `${user.firstName}, mira lo que otras parejas están logrando con MesaLista`;
          break;
        case 4:
          html = EmailTemplates.generateMarketingEmail4HTML(user.firstName, user.slug);
          subject = `${user.firstName}, te extrañamos 💜 - Oferta especial dentro`;
          break;
        case 'inactive_warning':
          html = EmailTemplates.generateInactiveUserWarningHTML(user.firstName, coupleName, giftCount);
          subject = `⚠️ ${user.firstName}, tu cuenta de MesaLista será cerrada pronto`;
          break;
        default:
          throw new Error('Invalid email type');
      }

      return { html, subject };
    } catch (error) {
      console.error('Error generating email preview:', error);
      throw error;
    }
  }
}

export default new EmailService();
