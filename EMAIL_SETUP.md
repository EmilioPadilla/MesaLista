# Email Configuration Setup - MesaLista

This document explains how to configure the email functionality for payment confirmations and notifications in MesaLista.

## Overview

The email system sends two types of emails when a payment is processed:

1. **Payment Confirmation Email** - Sent to the guest who made the payment
2. **Payment Notification Email** - Sent to the couple (registry owner) notifying them of the new gift

## SendGrid Configuration

### 1. Create SendGrid Account

1. Go to [SendGrid](https://sendgrid.com/) and create an account
2. Verify your account and complete the setup process
3. Navigate to Settings > API Keys
4. Create a new API key with "Full Access" permissions
5. Copy the API key (it starts with `SG.`)

### 2. Domain Authentication

1. In SendGrid, go to Settings > Sender Authentication
2. Click "Authenticate Your Domain"
3. Add your domain `mesalista.com.mx`
4. Follow the DNS configuration steps provided by SendGrid
5. Verify the domain authentication

### 3. Sender Identity

1. Go to Settings > Sender Authentication
2. Click "Create a Single Sender"
3. Set up the sender identity:
   - From Name: `MesaLista`
   - From Email: `no-responder@mesalista.com.mx`
   - Reply To: `support@mesalista.com.mx` (optional)
4. Verify the sender identity

## Environment Variables

Add the following environment variables to your `.env` file:

```bash
# SendGrid Email Configuration
SENDGRID_API_KEY="SG.your_actual_sendgrid_api_key_here"
FROM_EMAIL="no-responder@mesalista.com.mx"
```

## Email Templates

The system includes two beautifully designed email templates:

### Guest Payment Confirmation Email
- **Subject**: `¡Confirmación de pago! - Regalo para [Couple Name]`
- **Content**: Payment details, gift list, transaction information
- **Design**: Pink gradient header with celebration theme
- **Features**: Responsive design, gift images, payment summary table

### Owner Payment Notification Email
- **Subject**: `¡Nuevo regalo recibido! - [Guest Name] te ha enviado un regalo`
- **Content**: Gift details, guest information, payment method, personal message
- **Design**: Blue gradient header with gift theme
- **Features**: Responsive design, guest contact info, gift breakdown

## Email Service Features

### Automatic Email Sending
- Emails are automatically sent after successful payment processing
- Works with both Stripe and PayPal payments
- Includes error handling to prevent payment failures due to email issues

### Internationalization
- All emails are in Spanish (Mexican locale)
- Currency formatting in Mexican Pesos (MXN)
- Date formatting in Spanish format

### Rich Content
- HTML and plain text versions of all emails
- Responsive design for mobile devices
- Gift images included when available
- Personal messages from guests highlighted

### Error Handling
- Email failures don't affect payment processing
- Comprehensive error logging
- Graceful fallbacks for missing data

## Testing Email Functionality

### 1. Development Testing

For development, you can use SendGrid's sandbox mode:

```bash
# Add to your .env file for testing
NODE_ENV="development"
```

### 2. Test Email Addresses

Use these test scenarios:

1. **Valid Guest Email**: Use a real email address you control
2. **Valid Owner Email**: Use the couple's real email address
3. **Missing Guest Email**: Test with empty guest email (only owner gets notified)

### 3. Manual Testing

You can manually trigger email sending by calling the email service:

```typescript
import emailService from './server/services/emailService.js';

// Send emails for a specific cart ID
await emailService.sendPaymentEmails(cartId);
```

## Email Content Customization

### Modifying Templates

The email templates are defined in `/server/services/emailService.ts`:

- `generateGuestConfirmationEmailHTML()` - Guest confirmation HTML
- `generateGuestConfirmationEmailText()` - Guest confirmation text
- `generateOwnerNotificationEmailHTML()` - Owner notification HTML
- `generateOwnerNotificationEmailText()` - Owner notification text

### Customization Options

You can customize:
- Email colors and branding
- Content structure and messaging
- Additional data fields
- Language and localization
- Email subject lines

## Troubleshooting

### Common Issues

1. **Emails not sending**
   - Check SENDGRID_API_KEY is correctly set
   - Verify domain authentication in SendGrid
   - Check SendGrid account status and credits

2. **Emails going to spam**
   - Complete domain authentication
   - Set up SPF, DKIM, and DMARC records
   - Use authenticated sender identity

3. **Missing email data**
   - Verify cart has guest email address
   - Check database relationships are properly loaded
   - Review error logs for missing fields

### Debug Mode

Enable debug logging by setting:

```bash
DEBUG="email:*"
```

### SendGrid Dashboard

Monitor email delivery in the SendGrid dashboard:
- Activity Feed shows all email events
- Statistics show delivery rates
- Suppressions show bounced/blocked emails

## Production Considerations

### 1. Email Volume Limits
- SendGrid free tier: 100 emails/day
- Consider upgrading for production use
- Monitor usage in SendGrid dashboard

### 2. Delivery Optimization
- Complete domain authentication
- Maintain good sender reputation
- Monitor bounce and spam rates
- Use suppression lists appropriately

### 3. Backup Email Service
Consider implementing a backup email service for critical notifications:
- AWS SES as secondary provider
- Fallback to SMTP service
- Queue system for retry logic

## Security Best Practices

1. **API Key Security**
   - Never commit API keys to version control
   - Use environment variables only
   - Rotate API keys regularly
   - Use least-privilege API key permissions

2. **Email Content Security**
   - Sanitize user input in email content
   - Validate email addresses before sending
   - Implement rate limiting for email sending
   - Log email activities for audit trails

## Support

For issues with email functionality:
1. Check SendGrid dashboard for delivery status
2. Review application logs for error messages
3. Verify environment configuration
4. Test with SendGrid's email testing tools

For SendGrid-specific issues, consult the [SendGrid Documentation](https://docs.sendgrid.com/).
