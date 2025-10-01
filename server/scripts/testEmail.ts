import { PrismaClient } from '@prisma/client';
import emailService from '../services/emailService.js';
import { EmailTemplates } from '../templates/emailTemplates.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const prisma = new PrismaClient();

/**
 * Test script to verify email functionality
 * Usage: tsx server/scripts/testEmail.ts [cartId]
 */
async function testEmailFunctionality() {
  try {
    console.log('🧪 Testing Email Functionality...\n');

    // Get command line argument for cart ID
    const cartId = process.argv[2] ? parseInt(process.argv[2]) : null;

    if (cartId) {
      console.log(`📧 Testing emails for cart ID: ${cartId}`);
      await emailService.sendPaymentEmails(cartId);
      console.log('✅ Emails sent successfully!');
    } else {
      // Find the most recent paid cart for testing
      const recentCart = await prisma.cart.findFirst({
        where: {
          status: 'PAID',
          inviteeEmail: { not: null },
        },
        orderBy: { createdAt: 'desc' },
        include: {
          payment: true,
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
        },
      });

      if (!recentCart) {
        console.log('❌ No paid carts found for testing.');
        console.log('💡 Create a test payment first or provide a specific cart ID:');
        console.log('   tsx server/scripts/testEmail.ts [cartId]');
        return;
      }

      console.log(`📧 Testing emails for most recent cart ID: ${recentCart.id}`);
      console.log(`   Guest: ${recentCart.inviteeName} (${recentCart.inviteeEmail})`);
      console.log(`   Amount: ${recentCart.payment?.amount} ${recentCart.payment?.currency}`);
      console.log(`   Items: ${recentCart.items.length}`);
      console.log('');

      await emailService.sendPaymentEmails(recentCart.id);
      console.log('✅ Test emails sent successfully!');
    }

    console.log('\n📊 Email Test Summary:');
    console.log('   ✓ Guest confirmation email');
    console.log('   ✓ Owner notification email');
    console.log('\n💡 Check the recipient inboxes to verify email delivery.');
    console.log('📈 Monitor SendGrid dashboard for delivery status.');

  } catch (error) {
    console.error('❌ Email test failed:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('SENDGRID_API_KEY')) {
        console.log('\n💡 Make sure to set SENDGRID_API_KEY in your .env file');
      } else if (error.message.includes('Cart or payment not found')) {
        console.log('\n💡 The specified cart ID was not found or has no payment record');
      }
    }
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Test email templates with mock data
 */
async function testEmailTemplates() {
  try {
    console.log('🎨 Testing Email Templates with Mock Data...\n');

    const mockData = {
      cartId: 999,
      paymentId: 'test_payment_123',
      amount: 2500.00,
      currency: 'MXN',
      paymentType: 'STRIPE' as const,
      guestName: 'María González',
      guestEmail: 'maria.gonzalez@example.com',
      guestPhone: '+52 55 1234 5678',
      message: '¡Felicidades por su boda! Esperamos que disfruten mucho estos regalos. Con mucho cariño, María y familia.',
      items: [
        {
          giftTitle: 'Juego de Sábanas Premium',
          giftDescription: 'Sábanas de algodón egipcio 400 hilos',
          quantity: 1,
          price: 1200.00,
          imageUrl: 'https://example.com/sabanas.jpg',
        },
        {
          giftTitle: 'Cafetera Nespresso',
          giftDescription: 'Cafetera automática con espumador de leche',
          quantity: 1,
          price: 1300.00,
          imageUrl: 'https://example.com/cafetera.jpg',
        },
      ],
      coupleInfo: {
        coupleName: 'Sol y Emilio',
        firstName: 'Sol',
        lastName: 'Martínez',
        spouseFirstName: 'Emilio',
        spouseLastName: 'Padilla',
        email: 'sol.emilio@example.com',
        weddingDate: new Date('2024-06-15'),
        weddingLocation: 'Hacienda San José, Cuernavaca',
      },
    };

    console.log('📧 Sending test emails with mock data...');
    await emailService.sendPaymentConfirmationToGuest(mockData);
    await emailService.sendPaymentNotificationToOwner(mockData);
    
    console.log('\n🎨 Testing template generation...');
    const totalAmount = mockData.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const itemsCount = mockData.items.reduce((sum, item) => sum + item.quantity, 0);
    
    // Test template generation without sending
    const guestHTML = EmailTemplates.generateGuestConfirmationEmailHTML(mockData, totalAmount, itemsCount);
    const ownerHTML = EmailTemplates.generateOwnerNotificationEmailHTML(mockData, totalAmount, itemsCount);
    
    console.log(`✓ Guest HTML template generated (${guestHTML.length} characters)`);
    console.log(`✓ Owner HTML template generated (${ownerHTML.length} characters)`);
    
    console.log('✅ Template test emails sent successfully!');
    console.log('\n📊 Template Test Summary:');
    console.log(`   ✓ Guest email sent to: ${mockData.guestEmail}`);
    console.log(`   ✓ Owner email sent to: ${mockData.coupleInfo.email}`);
    console.log(`   ✓ Total amount: $${mockData.amount.toLocaleString('es-MX')} MXN`);
    console.log(`   ✓ Items count: ${mockData.items.length}`);

  } catch (error) {
    console.error('❌ Template test failed:', error);
  }
}

// Main execution
async function main() {
  const command = process.argv[2];

  if (command === 'templates') {
    await testEmailTemplates();
  } else {
    await testEmailFunctionality();
  }
}

// Run the test
main().catch(console.error);
