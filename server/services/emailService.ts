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
                  weddingList: {
                    include: {
                      couple: true,
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

      // Get couple info from the first item's wedding list
      const firstItem = cart.items[0];
      const weddingList = firstItem.gift.weddingList;
      const couple = weddingList.couple;

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
          coupleName: weddingList.coupleName,
          firstName: couple.firstName,
          lastName: couple.lastName,
          spouseFirstName: couple.spouseFirstName || undefined,
          spouseLastName: couple.spouseLastName || undefined,
          email: couple.email,
          weddingDate: weddingList.weddingDate,
          weddingLocation: weddingList.weddingLocation || undefined,
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
}

export default new EmailService();
