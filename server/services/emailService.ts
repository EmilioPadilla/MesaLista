import sgMail from '@sendgrid/mail';
import { PrismaClient } from '@prisma/client';
import { EmailTemplates } from '../templates/emailTemplates.js';

const prisma = new PrismaClient();

// Configure SendGrid
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY || '';
const FROM_EMAIL = process.env.FROM_EMAIL || 'no-responder@mesalista.com.mx';

if (SENDGRID_API_KEY) {
  sgMail.setApiKey(SENDGRID_API_KEY);
}

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
    if (!SENDGRID_API_KEY) {
      console.warn('SendGrid API key not configured. Skipping email.');
      return;
    }

    const totalAmount = data.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const itemsCount = data.items.reduce((sum, item) => sum + item.quantity, 0);

    const msg = {
      to: data.guestEmail,
      from: FROM_EMAIL,
      subject: `¡Confirmación de pago! - Regalo para ${data.coupleInfo.coupleName}`,
      html: EmailTemplates.generateGuestConfirmationEmailHTML(data, totalAmount, itemsCount),
      text: EmailTemplates.generateGuestConfirmationEmailText(data, totalAmount, itemsCount),
    };

    try {
      await sgMail.send(msg);
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
    if (!SENDGRID_API_KEY) {
      console.warn('SendGrid API key not configured. Skipping email.');
      return;
    }

    const totalAmount = data.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const itemsCount = data.items.reduce((sum, item) => sum + item.quantity, 0);

    const msg = {
      to: data.coupleInfo.email,
      from: FROM_EMAIL,
      subject: `¡Nuevo regalo recibido! - ${data.guestName} te ha enviado un regalo`,
      html: EmailTemplates.generateOwnerNotificationEmailHTML(data, totalAmount, itemsCount),
      text: EmailTemplates.generateOwnerNotificationEmailText(data, totalAmount, itemsCount),
    };

    try {
      await sgMail.send(msg);
      console.log(`Payment notification email sent to owner: ${data.coupleInfo.email}`);
    } catch (error) {
      console.error('Error sending payment notification email to owner:', error);
      throw error;
    }
  }

  /**
   * Get payment data from database and send both emails
   */
  async sendPaymentEmails(cartId: number): Promise<void> {
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
          // email: couple.email,
          email: 'padillam_@hotmail.com',
          weddingDate: weddingList.weddingDate,
          weddingLocation: weddingList.weddingLocation || undefined,
        },
      };

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
}

export default new EmailService();
