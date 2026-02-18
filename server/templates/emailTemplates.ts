import { PaymentEmailData } from '../services/emailService.js';

/**
 * Email template utilities and generators
 */
export class EmailTemplates {
  /**
   * Format currency in Mexican Peso format
   */
  private static formatCurrency(amount: number, currency: string): string {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount);
  }

  /**
   * Format date in Spanish format
   */
  private static formatDate(date: Date): string {
    return new Intl.DateTimeFormat('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  }

  /**
   * Format date and time in Spanish format
   */
  private static formatDateTime(date: Date): string {
    return new Intl.DateTimeFormat('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  }

  /**
   * Generate HTML email template for guest payment confirmation
   */
  static generateGuestConfirmationEmailHTML(data: PaymentEmailData, totalAmount: number, itemsCount: number): string {
    const formatCurrency = (amount: number) => this.formatCurrency(amount, data.currency);
    const formatDate = (date: Date) => this.formatDate(date);

    const itemsHTML = data.items
      .map(
        (item) => `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">
          ${item.imageUrl ? `<img src="${item.imageUrl}" alt="${item.giftTitle}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 8px; margin-right: 12px; float: left;">` : ''}
          <div>
            <strong>${item.giftTitle}</strong>
            ${item.giftDescription ? `<br><small style="color: #6b7280;">${item.giftDescription}</small>` : ''}
          </div>
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">${item.quantity}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">${formatCurrency(item.price)}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;"><strong>${formatCurrency(item.price * item.quantity)}</strong></td>
      </tr>
    `,
      )
      .join('');

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Confirmación de Pago - MesaLista</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #374151; margin: 0; padding: 0; background-color: #f9fafb;">
        <div style="max-width: 600px; margin: 0 auto; background-color: white; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <div style="background: #d4704a; color: white; padding: 32px 24px; text-align: center;">
            <h1 style="margin: 0; font-size: 28px; font-weight: bold;">¡Pago Confirmado!</h1>
            <p style="margin: 8px 0 0 0; font-size: 16px; opacity: 0.9;">Gracias por tu regalo para ${data.coupleInfo.coupleName}</p>
          </div>

          <!-- Content -->
          <div style="padding: 32px 24px;">


            <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
              <div style="display: flex; align-items: center;">
                <div style="font-size: 24px; margin-right: 16px;">✅</div>
                <div>
                  <strong style="color: #166534;">Pago procesado exitosamente</strong>
                  <br><small style="color: #166534;">ID de transacción: ${data.paymentId}</small>
                </div>
              </div>
            </div>

            <h2 style="color: #1f2937; margin-bottom: 16px;">Detalles de tu compra</h2>
            
            <div style="background-color: #f9fafb; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
              <p style="margin: 0 0 8px 0;"><strong>Nombre:</strong> ${data.guestName}</p>
              <p style="margin: 0 0 8px 0;"><strong>Email:</strong> ${data.guestEmail}</p>
              ${data.guestPhone ? `<p style="margin: 0 0 8px 0;"><strong>Teléfono:</strong> ${data.guestPhone}</p>` : ''}
              <p style="margin: 0 0 8px 0;"><strong>Método de pago:</strong> ${data.paymentType === 'STRIPE' ? 'Tarjeta de crédito/débito' : 'PayPal'}</p>
              <p style="margin: 0;"><strong>Fecha:</strong> ${formatDate(new Date())}</p>
            </div>

            ${
              data.message
                ? `
              <div style="border: 1px solid #d4704a; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
                <h3 style="margin: 0 0 8px 0; color: #92400e;">Tu mensaje para la pareja:</h3>
                <p style="margin: 0; color: #92400e; font-style: italic;">"${data.message}"</p>
              </div>
            `
                : ''
            }

            <h3 style="color: #1f2937; margin-bottom: 16px;">Mensaje por parte de los novios</h3>
            <div style="border: 1px solid #d4704a; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
              <p style="margin: 0; color: #92400e; font-style: italic;">¡Gracias de corazón por tu regalo! 🫶🏼 Nos emociona muchísimo recibirlo y sentir tu cariño tan cerquita. Cada detalle como este hace que este momento sea aún más especial, ¡y prometemos levantar una copa a tu salud cuando lo estrenemos/estemos allá! 🥂💃</p>
            </div>

            <h3 style="color: #1f2937; margin-bottom: 16px;">Regalos comprados (${itemsCount} ${itemsCount === 1 ? 'artículo' : 'artículos'})</h3>
            
            <table style="width: 100%; border-collapse: collapse; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
              <thead>
                <tr style="background-color: #f9fafb;">
                  <th style="padding: 12px; text-align: left; font-weight: 600; color: #374151;">Regalo</th>
                  <th style="padding: 12px; text-align: center; font-weight: 600; color: #374151;">Cantidad</th>
                  <th style="padding: 12px; text-align: right; font-weight: 600; color: #374151;">Precio</th>
                  <th style="padding: 12px; text-align: right; font-weight: 600; color: #374151;">Total</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHTML}
                <tr style="background-color: #f9fafb; font-weight: bold;">
                  <td colspan="3" style="padding: 16px; text-align: right; border-top: 2px solid #e5e7eb;">Total pagado:</td>
                  <td style="padding: 16px; text-align: right; border-top: 2px solid #e5e7eb; font-size: 18px; color: #059669;">${formatCurrency(totalAmount)}</td>
                </tr>
              </tbody>
            </table>

            <div style="background-color: #eff6ff; border: 1px solid #93c5fd; border-radius: 8px; padding: 16px; margin-top: 24px;">
              <h3 style="margin: 0 0 8px 0; color: #1e40af;">¿Qué sigue?</h3>
              <p style="margin: 0; color: #1e40af;">La pareja será notificada de tu regalo. ¡Gracias por ser parte de su día especial!</p>
            </div>
          </div>

          <!-- Footer -->
          <div style="background-color: #f9fafb; padding: 24px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 14px;">Este es un email automático de confirmación</p>
            <p style="margin: 0; color: #6b7280; font-size: 14px;">
              <strong>MesaLista</strong> - Haciendo los regalos de boda más fáciles
            </p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Generate text email template for guest payment confirmation
   */
  static generateGuestConfirmationEmailText(data: PaymentEmailData, totalAmount: number, itemsCount: number): string {
    const formatCurrency = (amount: number) => this.formatCurrency(amount, data.currency);
    const formatDate = (date: Date) => this.formatDate(date);

    const itemsList = data.items
      .map((item) => `- ${item.giftTitle} (Cantidad: ${item.quantity}) - ${formatCurrency(item.price * item.quantity)}`)
      .join('\n');

    return `
¡PAGO CONFIRMADO!

Gracias por tu regalo para ${data.coupleInfo.coupleName}

✓ Pago procesado exitosamente
ID de transacción: ${data.paymentId}

DETALLES DE TU COMPRA:
Nombre: ${data.guestName}
Email: ${data.guestEmail}
${data.guestPhone ? `Teléfono: ${data.guestPhone}\n` : ''}Método de pago: ${data.paymentType === 'STRIPE' ? 'Tarjeta de crédito/débito' : 'PayPal'}
Fecha: ${formatDate(new Date())}

${
  data.message
    ? `TU MENSAJE PARA LA PAREJA:
"${data.message}"

`
    : ''
}REGALOS COMPRADOS (${itemsCount} ${itemsCount === 1 ? 'artículo' : 'artículos'}):
${itemsList}

TOTAL PAGADO: ${formatCurrency(totalAmount)}

¿QUÉ SIGUE?
La pareja será notificada de tu regalo. ¡Gracias por ser parte de su día especial!

---
Este es un email automático de confirmación
MesaLista - Haciendo los regalos de boda más fáciles
    `.trim();
  }

  /**
   * Generate HTML email template for owner payment notification
   */
  static generateOwnerNotificationEmailHTML(data: PaymentEmailData, totalAmount: number, itemsCount: number): string {
    const formatCurrency = (amount: number) => this.formatCurrency(amount, data.currency);
    const formatDateTime = (date: Date) => this.formatDateTime(date);

    const itemsHTML = data.items
      .map(
        (item) => `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">
          ${item.imageUrl ? `<img src="${item.imageUrl}" alt="${item.giftTitle}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 8px; margin-right: 12px; float: left;">` : ''}
          <div>
            <strong>${item.giftTitle}</strong>
            ${item.giftDescription ? `<br><small style="color: #6b7280;">${item.giftDescription}</small>` : ''}
          </div>
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">${item.quantity}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">${formatCurrency(item.price)}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;"><strong>${formatCurrency(item.price * item.quantity)}</strong></td>
      </tr>
    `,
      )
      .join('');

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Nuevo Regalo Recibido - MesaLista</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #374151; margin: 0; padding: 0; background-color: #f9fafb;">
        <div style="max-width: 600px; margin: 0 auto; background-color: white; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); color: white; padding: 32px 24px; text-align: center;">
            <h1 style="margin: 0; font-size: 28px; font-weight: bold;">🎁 ¡Nuevo Regalo!</h1>
            <p style="margin: 8px 0 0 0; font-size: 16px; opacity: 0.9;">${data.guestName} te ha enviado un regalo</p>
          </div>

          <!-- Content -->
          <div style="padding: 32px 24px;">
            <div style="background-color: #fef3c7; border: 1px solid #fbbf24; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
              <div style="display: flex; align-items: center;">
                <div style="background-color: #f59e0b; color: white; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; margin-right: 12px; font-size: 16px;">🎉</div>
                <div>
                  <strong style="color: #92400e;">¡Felicidades! Alguien te ha enviado un regalo</strong>
                  <br><small style="color: #92400e;">Pago procesado el ${formatDateTime(new Date())}</small>
                </div>
              </div>
            </div>

            <h2 style="color: #1f2937; margin-bottom: 16px;">Información del regalo</h2>
            
            <div style="background-color: #f9fafb; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
              <p style="margin: 0 0 8px 0;"><strong>De:</strong> ${data.guestName}</p>
              <p style="margin: 0 0 8px 0;"><strong>Email:</strong> ${data.guestEmail}</p>
              ${data.guestPhone ? `<p style="margin: 0 0 8px 0;"><strong>Teléfono:</strong> ${data.guestPhone}</p>` : ''}
              <p style="margin: 0 0 8px 0;"><strong>Método de pago:</strong> ${data.paymentType === 'STRIPE' ? 'Tarjeta de crédito/débito' : 'PayPal'}</p>
              <p style="margin: 0 0 8px 0;"><strong>ID de transacción:</strong> ${data.paymentId}</p>
              <p style="margin: 0;"><strong>Total pagado:</strong> <span style="color: #059669; font-weight: bold; font-size: 18px;">${formatCurrency(totalAmount)}</span></p>
            </div>

            ${
              data.message
                ? `
              <div style="background-color: #ecfdf5; border: 1px solid #10b981; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
                <h3 style="margin: 0 0 8px 0; color: #065f46;">💌 Mensaje personal:</h3>
                <p style="margin: 0; color: #065f46; font-style: italic; font-size: 16px;">"${data.message}"</p>
              </div>
            `
                : ''
            }

            <h3 style="color: #1f2937; margin-bottom: 16px;">Regalos recibidos (${itemsCount} ${itemsCount === 1 ? 'artículo' : 'artículos'})</h3>
            
            <table style="width: 100%; border-collapse: collapse; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
              <thead>
                <tr style="background-color: #f9fafb;">
                  <th style="padding: 12px; text-align: left; font-weight: 600; color: #374151;">Regalo</th>
                  <th style="padding: 12px; text-align: center; font-weight: 600; color: #374151;">Cantidad</th>
                  <th style="padding: 12px; text-align: right; font-weight: 600; color: #374151;">Precio</th>
                  <th style="padding: 12px; text-align: right; font-weight: 600; color: #374151;">Total</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHTML}
                <tr style="background-color: #f0fdf4; font-weight: bold;">
                  <td colspan="3" style="padding: 16px; text-align: right; border-top: 2px solid #10b981; color: #065f46;">Total recibido:</td>
                  <td style="padding: 16px; text-align: right; border-top: 2px solid #10b981; font-size: 18px; color: #059669;">${formatCurrency(totalAmount)}</td>
                </tr>
              </tbody>
            </table>

            <div style="background-color: #eff6ff; border: 1px solid #93c5fd; border-radius: 8px; padding: 16px; margin-top: 24px;">
              <h3 style="margin: 0 0 8px 0; color: #1e40af;">💡 Recordatorio</h3>
              <p style="margin: 0; color: #1e40af;">No olvides agradecer a ${data.guestName} por su generoso regalo. Puedes contactarle en ${data.guestEmail}${data.guestPhone ? ` o al ${data.guestPhone}` : ''}.</p>
            </div>
          </div>

          <!-- Footer -->
          <div style="background-color: #f9fafb; padding: 24px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 14px;">Este es un email automático de notificación</p>
            <p style="margin: 0; color: #6b7280; font-size: 14px;">
              <strong>MesaLista</strong> - Haciendo los regalos de boda más fáciles
            </p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Generate text email template for owner payment notification
   */
  static generateOwnerNotificationEmailText(data: PaymentEmailData, totalAmount: number, itemsCount: number): string {
    const formatCurrency = (amount: number) => this.formatCurrency(amount, data.currency);
    const formatDateTime = (date: Date) => this.formatDateTime(date);

    const itemsList = data.items
      .map((item) => `- ${item.giftTitle} (Cantidad: ${item.quantity}) - ${formatCurrency(item.price * item.quantity)}`)
      .join('\n');

    return `
🎁 ¡NUEVO REGALO!

${data.guestName} te ha enviado un regalo

🎉 ¡Felicidades! Alguien te ha enviado un regalo
Pago procesado el ${formatDateTime(new Date())}

INFORMACIÓN DEL REGALO:
De: ${data.guestName}
Email: ${data.guestEmail}
${data.guestPhone ? `Teléfono: ${data.guestPhone}\n` : ''}Método de pago: ${data.paymentType === 'STRIPE' ? 'Tarjeta de crédito/débito' : 'PayPal'}
ID de transacción: ${data.paymentId}
Total pagado: ${formatCurrency(totalAmount)}

${
  data.message
    ? `💌 MENSAJE PERSONAL:
"${data.message}"

`
    : ''
}REGALOS RECIBIDOS (${itemsCount} ${itemsCount === 1 ? 'artículo' : 'artículos'}):
${itemsList}

TOTAL RECIBIDO: ${formatCurrency(totalAmount)}

💡 RECORDATORIO:
No olvides agradecer a ${data.guestName} por su generoso regalo. Puedes contactarle en ${data.guestEmail}${data.guestPhone ? ` o al ${data.guestPhone}` : ''}.

---
Este es un email automático de notificación
MesaLista - Haciendo los regalos de boda más fáciles
    `.trim();
  }

  /**
   * Generate HTML email template for admin contact form notification
   */
  static generateContactFormAdminEmailHTML(data: {
    name: string;
    email: string;
    phone?: string;
    subject: string;
    message: string;
  }): string {
    const subjectMap: Record<string, string> = {
      'crear-lista': 'Crear lista de regalos',
      'comprar-regalo': 'Comprar un regalo',
      'problema-tecnico': 'Problema técnico',
      'facturacion': 'Facturación',
      'sugerencia': 'Sugerencia',
      'otro': 'Otro',
    };

    const subjectText = subjectMap[data.subject] || data.subject;

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Nuevo mensaje de contacto</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f7;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f7; padding: 40px 20px;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                  <!-- Header -->
                  <tr>
                    <td style="background: linear-gradient(135deg, #007aff 0%, #0051d0 100%); padding: 40px; text-align: center;">
                      <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600;">Nuevo Mensaje de Contacto</h1>
                    </td>
                  </tr>
                  
                  <!-- Content -->
                  <tr>
                    <td style="padding: 40px;">
                      <h2 style="color: #1d1d1f; margin: 0 0 24px 0; font-size: 20px; font-weight: 600;">Información del Contacto</h2>
                      
                      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
                        <tr>
                          <td style="padding: 12px 0; border-bottom: 1px solid #e5e5e7;">
                            <strong style="color: #1d1d1f;">Nombre:</strong>
                            <span style="color: #6e6e73; margin-left: 8px;">${data.name}</span>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding: 12px 0; border-bottom: 1px solid #e5e5e7;">
                            <strong style="color: #1d1d1f;">Email:</strong>
                            <a href="mailto:${data.email}" style="color: #007aff; margin-left: 8px; text-decoration: none;">${data.email}</a>
                          </td>
                        </tr>
                        ${
                          data.phone
                            ? `
                        <tr>
                          <td style="padding: 12px 0; border-bottom: 1px solid #e5e5e7;">
                            <strong style="color: #1d1d1f;">Teléfono:</strong>
                            <a href="tel:${data.phone}" style="color: #007aff; margin-left: 8px; text-decoration: none;">${data.phone}</a>
                          </td>
                        </tr>
                        `
                            : ''
                        }
                        <tr>
                          <td style="padding: 12px 0; border-bottom: 1px solid #e5e5e7;">
                            <strong style="color: #1d1d1f;">Asunto:</strong>
                            <span style="color: #6e6e73; margin-left: 8px;">${subjectText}</span>
                          </td>
                        </tr>
                      </table>
                      
                      <h3 style="color: #1d1d1f; margin: 24px 0 12px 0; font-size: 18px; font-weight: 600;">Mensaje:</h3>
                      <div style="background-color: #f5f5f7; padding: 20px; border-radius: 12px; color: #1d1d1f; line-height: 1.6; white-space: pre-wrap;">${data.message}</div>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="background-color: #f5f5f7; padding: 24px; text-align: center;">
                      <p style="color: #6e6e73; margin: 0; font-size: 14px;">
                        Este mensaje fue enviado desde el formulario de contacto de MesaLista
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `;
  }

  /**
   * Generate text email template for admin contact form notification
   */
  static generateContactFormAdminEmailText(data: {
    name: string;
    email: string;
    phone?: string;
    subject: string;
    message: string;
  }): string {
    const subjectMap: Record<string, string> = {
      'crear-lista': 'Crear lista de regalos',
      'comprar-regalo': 'Comprar un regalo',
      'problema-tecnico': 'Problema técnico',
      'facturacion': 'Facturación',
      'sugerencia': 'Sugerencia',
      'otro': 'Otro',
    };

    const subjectText = subjectMap[data.subject] || data.subject;

    return `
Nuevo Mensaje de Contacto - MesaLista

Información del Contacto:
- Nombre: ${data.name}
- Email: ${data.email}
${data.phone ? `- Teléfono: ${data.phone}` : ''}
- Asunto: ${subjectText}

Mensaje:
${data.message}

---
Este mensaje fue enviado desde el formulario de contacto de MesaLista
    `.trim();
  }

  /**
   * Generate HTML email template for user contact form confirmation
   */
  static generateContactFormUserEmailHTML(data: { name: string; email: string; phone?: string; subject: string; message: string }): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Confirmación de contacto</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f7;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f7; padding: 40px 20px;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                  <!-- Header -->
                  <tr>
                    <td style="background: linear-gradient(135deg, #34c759 0%, #30d158 100%); padding: 40px; text-align: center;">
                      <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600;">¡Gracias por contactarnos!</h1>
                    </td>
                  </tr>
                  
                  <!-- Content -->
                  <tr>
                    <td style="padding: 40px;">
                      <p style="color: #1d1d1f; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                        Hola <strong>${data.name}</strong>,
                      </p>
                      
                      <p style="color: #1d1d1f; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                        Hemos recibido tu mensaje y nuestro equipo lo revisará pronto. Te responderemos en un plazo máximo de 24 horas.
                      </p>
                      
                      <div style="background-color: #f5f5f7; padding: 20px; border-radius: 12px; margin: 24px 0;">
                        <p style="color: #6e6e73; margin: 0 0 8px 0; font-size: 14px;"><strong>Tu mensaje:</strong></p>
                        <p style="color: #1d1d1f; margin: 0; line-height: 1.6; white-space: pre-wrap;">${data.message}</p>
                      </div>
                      
                      <p style="color: #1d1d1f; font-size: 16px; line-height: 1.6; margin: 24px 0 0 0;">
                        Saludos,<br>
                        <strong>El equipo de MesaLista</strong>
                      </p>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="background-color: #f5f5f7; padding: 24px; text-align: center;">
                      <p style="color: #6e6e73; margin: 0; font-size: 14px;">
                        © 2026 MesaLista. Todos los derechos reservados.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `;
  }

  /**
   * Generate text email template for user contact form confirmation
   */
  static generateContactFormUserEmailText(data: { name: string; email: string; phone?: string; subject: string; message: string }): string {
    return `
Hola ${data.name},

Hemos recibido tu mensaje y nuestro equipo lo revisará pronto. Te responderemos en un plazo máximo de 24 horas.

Tu mensaje:
${data.message}

Saludos,
El equipo de MesaLista

---
© 2026 MesaLista. Todos los derechos reservados.
    `.trim();
  }

  /**
   * Generate HTML email template for email verification code
   */
  static generateVerificationCodeEmailHTML(email: string, code: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Código de Verificación - MesaLista</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #374151; margin: 0; padding: 0; background-color: #f9fafb;">
        <div style="max-width: 600px; margin: 0 auto; background-color: white; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #d4704a 0%, #b85a3a 100%); color: white; padding: 32px 24px; text-align: center;">
            <h1 style="margin: 0; font-size: 28px; font-weight: bold;">Verifica tu correo electrónico</h1>
            <p style="margin: 8px 0 0 0; font-size: 16px; opacity: 0.9;">Estás a un paso de crear tu cuenta en MesaLista</p>
          </div>

          <!-- Content -->
          <div style="padding: 32px 24px;">
            <p style="font-size: 16px; margin-bottom: 24px;">Hola,</p>
            
            <p style="font-size: 16px; margin-bottom: 24px;">
              Recibimos una solicitud para crear una cuenta en MesaLista con este correo electrónico. 
              Para continuar, por favor ingresa el siguiente código de verificación:
            </p>

            <!-- Verification Code Box -->
            <div style="background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%); border: 2px solid #d4704a; border-radius: 12px; padding: 24px; text-align: center; margin: 32px 0;">
              <p style="margin: 0 0 8px 0; font-size: 14px; color: #6b7280; text-transform: uppercase; letter-spacing: 1px;">Tu código de verificación</p>
              <div style="font-size: 42px; font-weight: bold; color: #d4704a; letter-spacing: 8px; font-family: 'Courier New', monospace;">
                ${code}
              </div>
              <p style="margin: 8px 0 0 0; font-size: 12px; color: #6b7280;">Este código expira en 10 minutos</p>
            </div>

            <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin: 24px 0; border-radius: 4px;">
              <p style="margin: 0; font-size: 14px; color: #92400e;">
                <strong>⚠️ Importante:</strong> Si no solicitaste este código, puedes ignorar este correo de forma segura.
              </p>
            </div>

            <p style="font-size: 14px; color: #6b7280; margin-top: 32px;">
              Este código es personal e intransferible. No lo compartas con nadie.
            </p>
          </div>

          <!-- Footer -->
          <div style="background-color: #f9fafb; padding: 24px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="margin: 0; font-size: 14px; color: #6b7280;">
              ¿Necesitas ayuda? Contáctanos en 
              <a href="mailto:info@mesalista.com.mx" style="color: #d4704a; text-decoration: none;">info@mesalista.com.mx</a>
            </p>
            <p style="margin: 16px 0 0 0; font-size: 12px; color: #9ca3af;">
              © 2026 MesaLista. Todos los derechos reservados.
            </p>
          </div>
        </div>
      </body>
      </html>
    `.trim();
  }

  /**
   * Generate plain text email for email verification code
   */
  static generateVerificationCodeEmailText(email: string, code: string): string {
    return `
VERIFICA TU CORREO ELECTRÓNICO - MESALISTA

Hola,

Recibimos una solicitud para crear una cuenta en MesaLista con este correo electrónico.

TU CÓDIGO DE VERIFICACIÓN:
${code}

Este código expira en 10 minutos.

Para continuar con el registro, ingresa este código en la página de verificación.

⚠️ IMPORTANTE: Si no solicitaste este código, puedes ignorar este correo de forma segura.

Este código es personal e intransferible. No lo compartas con nadie.

---

¿Necesitas ayuda? Contáctanos en info@mesalista.com.mx

© 2026 MesaLista. Todos los derechos reservados.
    `.trim();
  }

  /**
   * Generate HTML email template for password reset
   */
  static generatePasswordResetEmailHTML(firstName: string, resetLink: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Restablecer Contraseña - MesaLista</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #374151; margin: 0; padding: 0; background-color: #f9fafb;">
        <div style="max-width: 600px; margin: 0 auto; background-color: white; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #d4704a 0%, #b85a3a 100%); color: white; padding: 32px 24px; text-align: center;">
            <h1 style="margin: 0; font-size: 28px; font-weight: bold;">Restablecer Contraseña</h1>
            <p style="margin: 8px 0 0 0; font-size: 16px; opacity: 0.9;">Solicitud de cambio de contraseña</p>
          </div>

          <!-- Content -->
          <div style="padding: 32px 24px;">
            <p style="font-size: 16px; margin-bottom: 24px;">Hola ${firstName},</p>
            
            <p style="font-size: 16px; margin-bottom: 24px;">
              Recibimos una solicitud para restablecer la contraseña de tu cuenta en MesaLista. 
              Si fuiste tú quien lo solicitó, haz clic en el botón de abajo para crear una nueva contraseña:
            </p>

            <!-- Reset Button -->
            <div style="text-align: center; margin: 32px 0;">
              <a href="${resetLink}" 
                 style="display: inline-block; background: linear-gradient(135deg, #d4704a 0%, #b85a3a 100%); color: white; text-decoration: none; padding: 16px 48px; border-radius: 8px; font-weight: bold; font-size: 16px; box-shadow: 0 4px 6px rgba(212, 112, 74, 0.3);">
                Restablecer Contraseña
              </a>
            </div>

            <p style="font-size: 14px; color: #6b7280; margin: 24px 0;">
              O copia y pega este enlace en tu navegador:
            </p>
            <div style="background-color: #f3f4f6; padding: 12px; border-radius: 6px; word-break: break-all; font-size: 12px; color: #4b5563; margin-bottom: 24px;">
              ${resetLink}
            </div>

            <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin: 24px 0; border-radius: 4px;">
              <p style="margin: 0 0 8px 0; font-size: 14px; color: #92400e;">
                <strong>⚠️ Importante:</strong>
              </p>
              <ul style="margin: 0; padding-left: 20px; font-size: 14px; color: #92400e;">
                <li>Este enlace expira en 1 hora por seguridad</li>
                <li>Si no solicitaste este cambio, ignora este correo</li>
                <li>Tu contraseña actual seguirá siendo válida</li>
              </ul>
            </div>

            <div style="background-color: #dbeafe; border-left: 4px solid #3b82f6; padding: 16px; margin: 24px 0; border-radius: 4px;">
              <p style="margin: 0; font-size: 14px; color: #1e40af;">
                <strong>💡 Consejo de seguridad:</strong> Usa una contraseña única que no hayas usado en otros sitios. 
                Combina letras mayúsculas, minúsculas, números y símbolos.
              </p>
            </div>
          </div>

          <!-- Footer -->
          <div style="background-color: #f9fafb; padding: 24px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="margin: 0; font-size: 14px; color: #6b7280;">
              ¿Necesitas ayuda? Contáctanos en 
              <a href="mailto:info@mesalista.com.mx" style="color: #d4704a; text-decoration: none;">info@mesalista.com.mx</a>
            </p>
            <p style="margin: 16px 0 0 0; font-size: 12px; color: #9ca3af;">
              © 2026 MesaLista. Todos los derechos reservados.
            </p>
          </div>
        </div>
      </body>
      </html>
    `.trim();
  }

  /**
   * Generate plain text email for password reset
   */
  static generatePasswordResetEmailText(firstName: string, resetLink: string): string {
    return `
RESTABLECER CONTRASEÑA - MESALISTA

Hola ${firstName},

Recibimos una solicitud para restablecer la contraseña de tu cuenta en MesaLista.

Para crear una nueva contraseña, visita el siguiente enlace:
${resetLink}

⚠️ IMPORTANTE:
- Este enlace expira en 1 hora por seguridad
- Si no solicitaste este cambio, ignora este correo
- Tu contraseña actual seguirá siendo válida

💡 CONSEJO DE SEGURIDAD:
Usa una contraseña única que no hayas usado en otros sitios. Combina letras mayúsculas, minúsculas, números y símbolos.

---

¿Necesitas ayuda? Contáctanos en info@mesalista.com.mx

© 2026 MesaLista. Todos los derechos reservados.
    `.trim();
  }

  /**
   * Generate HTML email template for admin notification on new user signup
   */
  static generateAdminSignupNotificationEmailHTML(data: {
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
  }): string {
    const coupleName = `${data.firstName}${data.spouseFirstName ? ' y ' + data.spouseFirstName : ''}`;
    const fullName = `${data.firstName} ${data.lastName}${data.spouseFirstName ? ' y ' + data.spouseFirstName + ' ' + (data.spouseLastName || data.lastName) : ''}`;
    const planTypeText = data.planType === 'FIXED' ? 'Plan Fijo ($2,000 MXN)' : 'Plan Comisión (5%)';
    const registryUrl = `https://mesalista.com.mx/${data.slug}/regalos`;

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Nueva Cuenta Creada - MesaLista</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #374151; margin: 0; padding: 0; background-color: #f9fafb;">
        <div style="max-width: 600px; margin: 0 auto; background-color: white; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 32px 24px; text-align: center;">
            <h1 style="margin: 0; font-size: 28px; font-weight: bold;">🎉 Nueva Cuenta Creada</h1>
            <p style="margin: 8px 0 0 0; font-size: 16px; opacity: 0.9;">Un nuevo usuario se ha registrado en MesaLista</p>
          </div>

          <!-- Content -->
          <div style="padding: 32px 24px;">
            <div style="background-color: #d1fae5; border: 1px solid #10b981; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
              <div style="display: flex; align-items: center;">
                <div style="font-size: 24px; margin-right: 16px;">✅</div>
                <div>
                  <strong style="color: #065f46;">Nueva lista de regalos creada</strong>
                  <br><small style="color: #065f46;">Fecha: ${this.formatDateTime(data.createdAt)}</small>
                </div>
              </div>
            </div>

            <h2 style="color: #1f2937; margin-bottom: 16px;">Información de la Pareja</h2>
            
            <div style="background-color: #f9fafb; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
              <p style="margin: 0 0 8px 0;"><strong>Nombre completo:</strong> ${fullName}</p>
              <p style="margin: 0 0 8px 0;"><strong>Nombre de pareja:</strong> ${coupleName}</p>
              <p style="margin: 0 0 8px 0;"><strong>Email:</strong> <a href="mailto:${data.email}" style="color: #d4704a; text-decoration: none;">${data.email}</a></p>
              ${data.phoneNumber ? `<p style="margin: 0 0 8px 0;"><strong>Teléfono:</strong> <a href="tel:${data.phoneNumber}" style="color: #d4704a; text-decoration: none;">${data.phoneNumber}</a></p>` : ''}
              <p style="margin: 0 0 8px 0;"><strong>Slug de pareja:</strong> <code style="background-color: #e5e7eb; padding: 2px 6px; border-radius: 4px; font-size: 14px;">${data.slug}</code></p>
              <p style="margin: 0;"><strong>Tipo de plan:</strong> <span style="color: ${data.planType === 'FIXED' ? '#059669' : '#3b82f6'}; font-weight: 600;">${planTypeText}</span></p>
            </div>

            ${
              data.discountCode
                ? `
            <div style="background-color: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
              <p style="margin: 0; color: #92400e;">
                <strong>🎟️ Código de descuento usado:</strong> <code style="background-color: #fde68a; padding: 2px 6px; border-radius: 4px; font-weight: 600;">${data.discountCode}</code>
              </p>
            </div>
            `
                : ''
            }

            <h3 style="color: #1f2937; margin-bottom: 16px;">Enlace a la Lista de Regalos</h3>
            
            <div style="background-color: #eff6ff; border: 1px solid #3b82f6; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
              <p style="margin: 0 0 8px 0; color: #1e40af;"><strong>URL pública:</strong></p>
              <a href="${registryUrl}" style="color: #3b82f6; word-break: break-all; text-decoration: none; font-weight: 500;">${registryUrl}</a>
            </div>

            <div style="background-color: #f0fdf4; border-left: 4px solid #10b981; padding: 16px; margin-top: 24px; border-radius: 4px;">
              <p style="margin: 0; color: #065f46;">
                <strong>💡 Acción sugerida:</strong> Puedes contactar a la pareja para darles la bienvenida y ofrecerles asistencia para configurar su lista de regalos.
              </p>
            </div>
          </div>

          <!-- Footer -->
          <div style="background-color: #f9fafb; padding: 24px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 14px;">Este es un email automático de notificación</p>
            <p style="margin: 0; color: #6b7280; font-size: 14px;">
              <strong>MesaLista Admin</strong> - Panel de administración
            </p>
          </div>
        </div>
      </body>
      </html>
    `.trim();
  }

  /**
   * Generate plain text email for admin notification on new user signup
   */
  static generateAdminSignupNotificationEmailText(data: {
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
  }): string {
    const coupleName = `${data.firstName}${data.spouseFirstName ? ' y ' + data.spouseFirstName : ''}`;
    const fullName = `${data.firstName} ${data.lastName}${data.spouseFirstName ? ' y ' + data.spouseFirstName + ' ' + (data.spouseLastName || data.lastName) : ''}`;
    const planTypeText = data.planType === 'FIXED' ? 'Plan Fijo ($2,000 MXN)' : 'Plan Comisión (5%)';
    const registryUrl = `https://mesalista.com.mx/${data.slug}/regalos`;

    return `
🎉 NUEVA CUENTA CREADA - MESALISTA

Un nuevo usuario se ha registrado en MesaLista

✅ Nueva lista de regalos creada
Fecha: ${this.formatDateTime(data.createdAt)}

INFORMACIÓN DE LA PAREJA:
- Nombre completo: ${fullName}
- Nombre de pareja: ${coupleName}
- Email: ${data.email}
${data.phoneNumber ? `- Teléfono: ${data.phoneNumber}\n` : ''}- Slug de pareja: ${data.slug}
- Tipo de plan: ${planTypeText}

${
  data.discountCode
    ? `🎟️ CÓDIGO DE DESCUENTO USADO: ${data.discountCode}

`
    : ''
}ENLACE A LA LISTA DE REGALOS:
${registryUrl}

💡 ACCIÓN SUGERIDA:
Puedes contactar a la pareja para darles la bienvenida y ofrecerles asistencia para configurar su lista de regalos.

---
Este es un email automático de notificación
MesaLista Admin - Panel de administración
    `.trim();
  }

  /**
   * Generate HTML email template for welcome email to new users
   */
  static generateWelcomeEmailHTML(data: {
    firstName: string;
    spouseFirstName?: string;
    slug: string;
    planType: 'FIXED' | 'COMMISSION';
  }): string {
    const coupleName = `${data.firstName}${data.spouseFirstName ? ' y ' + data.spouseFirstName : ''}`;
    const dashboardUrl = 'https://mesalista.com.mx/dashboard';
    const registryUrl = `https://mesalista.com.mx/${data.slug}/regalos`;
    const supportEmail = 'info@mesalista.com.mx';

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>¡Bienvenidos a MesaLista!</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #374151; margin: 0; padding: 0; background-color: #f9fafb;">
        <div style="max-width: 600px; margin: 0 auto; background-color: white; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #d4704a 0%, #b85a3a 100%); color: white; padding: 40px 24px; text-align: center;">
            <h1 style="margin: 0; font-size: 32px; font-weight: bold;">🎉 ¡Bienvenidos a MesaLista!</h1>
            <p style="margin: 12px 0 0 0; font-size: 18px; opacity: 0.95;">Tu lista de regalos está lista para comenzar</p>
          </div>

          <!-- Content -->
          <div style="padding: 40px 24px;">
            <p style="font-size: 18px; margin-bottom: 16px; color: #1f2937;">
              Hola <strong>${coupleName}</strong>,
            </p>
            
            <p style="font-size: 16px; margin-bottom: 24px; color: #374151; line-height: 1.8;">
              ¡Felicidades por crear tu cuenta en MesaLista! 🎊 Estamos emocionados de ser parte de este momento tan especial en sus vidas. 
              Tu lista de regalos ya está activa y lista para compartir con tus invitados.
            </p>

            <!-- Success Box -->
            <div style="background-color: #d1fae5; border: 2px solid #10b981; border-radius: 12px; padding: 20px; margin: 32px 0; text-align: center;">
              <div style="font-size: 48px; margin-bottom: 12px;">✅</div>
              <p style="margin: 0; color: #065f46; font-size: 18px; font-weight: 600;">
                ¡Tu cuenta ha sido creada exitosamente!
              </p>
            </div>

            <!-- Quick Start Guide -->
            <h2 style="color: #1f2937; margin: 32px 0 20px 0; font-size: 22px; font-weight: 600;">🚀 Primeros pasos para comenzar</h2>
            
            <div style="margin-bottom: 24px;">
              <!-- Step 1 -->
              <div style="background-color: #f9fafb; border-left: 4px solid #d4704a; padding: 20px; margin-bottom: 16px; border-radius: 8px;">
                <table cellpadding="0" cellspacing="0" border="0" width="100%">
                  <tr>
                    <td style="width: 32px; vertical-align: top; padding-right: 16px;">
                      <div style="background-color: #d4704a; color: white; border-radius: 50%; width: 32px; height: 32px; text-align: center; line-height: 32px; font-weight: bold; font-size: 16px;">1</div>
                    </td>
                    <td style="vertical-align: top;">
                      <h3 style="margin: 0 0 8px 0; color: #1f2937; font-size: 16px; font-weight: 600;">Agrega tus regalos</h3>
                      <p style="margin: 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
                        Crea tu lista de regalos con fotos, descripciones y precios. Puedes agregar desde electrodomésticos hasta experiencias de viaje. 
                        ¡Sé creativo y agrega todo lo que necesiten para su nueva vida juntos!
                      </p>
                    </td>
                  </tr>
                </table>
              </div>

              <!-- Step 2 -->
              <div style="background-color: #f9fafb; border-left: 4px solid #d4704a; padding: 20px; margin-bottom: 16px; border-radius: 8px;">
                <table cellpadding="0" cellspacing="0" border="0" width="100%">
                  <tr>
                    <td style="width: 32px; vertical-align: top; padding-right: 16px;">
                      <div style="background-color: #d4704a; color: white; border-radius: 50%; width: 32px; height: 32px; text-align: center; line-height: 32px; font-weight: bold; font-size: 16px;">2</div>
                    </td>
                    <td style="vertical-align: top;">
                      <h3 style="margin: 0 0 8px 0; color: #1f2937; font-size: 16px; font-weight: 600;">Gestiona tus confirmaciones (RSVPs)</h3>
                      <p style="margin: 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
                        Crea y administra las confirmaciones de asistencia de tus invitados. Mantén todo organizado en un solo lugar 
                        y lleva el control de quién asistirá a tu gran día.
                      </p>
                    </td>
                  </tr>
                </table>
              </div>

              <!-- Step 3 -->
              <div style="background-color: #f9fafb; border-left: 4px solid #d4704a; padding: 20px; border-radius: 8px;">
                <table cellpadding="0" cellspacing="0" border="0" width="100%">
                  <tr>
                    <td style="width: 32px; vertical-align: top; padding-right: 16px;">
                      <div style="background-color: #d4704a; color: white; border-radius: 50%; width: 32px; height: 32px; text-align: center; line-height: 32px; font-weight: bold; font-size: 16px;">3</div>
                    </td>
                    <td style="vertical-align: top;">
                      <h3 style="margin: 0 0 8px 0; color: #1f2937; font-size: 16px; font-weight: 600;">Comparte tu lista</h3>
                      <p style="margin: 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
                        Una vez que tengas tus regalos listos, comparte el enlace de tu lista con familiares y amigos. 
                        Ellos podrán ver tus regalos y hacer sus contribuciones de forma fácil y segura.
                      </p>
                    </td>
                  </tr>
                </table>
              </div>
            </div>

            <!-- Action Buttons -->
            <div style="text-align: center; margin: 40px 0;">
              <a href="${dashboardUrl}" 
                 style="display: inline-block; background: linear-gradient(135deg, #d4704a 0%, #b85a3a 100%); color: white; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-weight: bold; font-size: 16px; box-shadow: 0 4px 6px rgba(212, 112, 74, 0.3); margin-bottom: 12px;">
                Ir a mi Panel de Control
              </a>
              <br>
              <a href="${registryUrl}" 
                 style="display: inline-block; background-color: white; color: #d4704a; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-weight: bold; font-size: 16px; border: 2px solid #d4704a; margin-top: 12px;">
                Ver mi Lista Pública
              </a>
            </div>

            <!-- Tips Section -->
            <div style="background-color: #eff6ff; border: 2px solid #3b82f6; border-radius: 12px; padding: 24px; margin: 32px 0;">
              <h3 style="margin: 0 0 16px 0; color: #1e40af; font-size: 18px; font-weight: 600;">💡 Consejos útiles</h3>
              <ul style="margin: 0; padding-left: 20px; color: #1e40af; font-size: 14px; line-height: 1.8;">
                <li style="margin-bottom: 8px;">Agrega fotos de alta calidad a tus regalos para que luzcan mejor</li>
                <li style="margin-bottom: 8px;">Incluye descripciones detalladas para ayudar a tus invitados a elegir</li>
                <li style="margin-bottom: 8px;">Varía los precios para que haya opciones para todos los presupuestos</li>
                <li style="margin-bottom: 8px;">Revisa regularmente tu panel para ver qué regalos han sido comprados</li>
                <li>Actualiza tu lista conforme cambien tus necesidades</li>
              </ul>
            </div>

            <!-- Support Section -->
            <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; margin: 32px 0; border-radius: 8px;">
              <h3 style="margin: 0 0 12px 0; color: #92400e; font-size: 16px; font-weight: 600;">🤝 ¿Necesitas ayuda?</h3>
              <p style="margin: 0; color: #92400e; font-size: 14px; line-height: 1.6;">
                Nuestro equipo está aquí para ayudarte. Si tienes alguna pregunta o necesitas asistencia, 
                no dudes en contactarnos en <a href="mailto:${supportEmail}" style="color: #d4704a; text-decoration: none; font-weight: 600;">${supportEmail}</a>. 
                Responderemos lo antes posible.
              </p>
            </div>

            <!-- Registry Link Box -->
            <div style="background-color: #f0fdf4; border: 2px solid #10b981; border-radius: 12px; padding: 20px; margin: 32px 0;">
              <h3 style="margin: 0 0 12px 0; color: #065f46; font-size: 16px; font-weight: 600;">🔗 Tu enlace personalizado</h3>
              <p style="margin: 0 0 12px 0; color: #065f46; font-size: 14px;">
                Comparte este enlace con tus invitados:
              </p>
              <div style="background-color: white; padding: 12px; border-radius: 6px; word-break: break-all; font-size: 14px; color: #059669; font-weight: 500; border: 1px solid #10b981;">
                ${registryUrl}
              </div>
            </div>

            <p style="font-size: 16px; margin: 32px 0 0 0; color: #374151; line-height: 1.8;">
              Gracias por confiar en MesaLista para este momento tan importante. ¡Les deseamos mucha felicidad en su camino juntos! 💕
            </p>

            <p style="font-size: 16px; margin: 24px 0 0 0; color: #6b7280;">
              Con cariño,<br>
              <strong style="color: #1f2937;">El equipo de MesaLista</strong>
            </p>
          </div>

          <!-- Footer -->
          <div style="background-color: #f9fafb; padding: 24px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 14px;">
              ¿Necesitas ayuda? Contáctanos en 
              <a href="mailto:${supportEmail}" style="color: #d4704a; text-decoration: none;">${supportEmail}</a>
            </p>
            <p style="margin: 16px 0 0 0; font-size: 12px; color: #9ca3af;">
              © 2026 MesaLista. Todos los derechos reservados.
            </p>
          </div>
        </div>
      </body>
      </html>
    `.trim();
  }

  /**
   * Generate plain text email for welcome email to new users
   */
  static generateWelcomeEmailText(data: {
    firstName: string;
    spouseFirstName?: string;
    slug: string;
    planType: 'FIXED' | 'COMMISSION';
  }): string {
    const coupleName = `${data.firstName}${data.spouseFirstName ? ' y ' + data.spouseFirstName : ''}`;
    const dashboardUrl = 'https://mesalista.com.mx/dashboard';
    const registryUrl = `https://mesalista.com.mx/${data.slug}/regalos`;
    const supportEmail = 'info@mesalista.com.mx';

    return `
🎉 ¡BIENVENIDOS A MESALISTA!

Tu lista de regalos está lista para comenzar

Hola ${coupleName},

¡Felicidades por crear tu cuenta en MesaLista! 🎊 Estamos emocionados de ser parte de este momento tan especial en sus vidas. Tu lista de regalos ya está activa y lista para compartir con tus invitados.

✅ ¡TU CUENTA HA SIDO CREADA EXITOSAMENTE!

🚀 PRIMEROS PASOS PARA COMENZAR:

1. AGREGA TUS REGALOS
   Crea tu lista de regalos con fotos, descripciones y precios. Puedes agregar desde electrodomésticos hasta experiencias de viaje. ¡Sé creativo y agrega todo lo que necesiten para su nueva vida juntos!

2. GESTIONA TUS CONFIRMACIONES (RSVPs)
   Crea y administra las confirmaciones de asistencia de tus invitados. Mantén todo organizado en un solo lugar y lleva el control de quién asistirá a tu gran día.

3. COMPARTE TU LISTA
   Una vez que tengas tus regalos listos, comparte el enlace de tu lista con familiares y amigos. Ellos podrán ver tus regalos y hacer sus contribuciones de forma fácil y segura.

ENLACES IMPORTANTES:
- Panel de Control: ${dashboardUrl}
- Tu Lista Pública: ${registryUrl}

💡 CONSEJOS ÚTILES:
- Agrega fotos de alta calidad a tus regalos para que luzcan mejor
- Incluye descripciones detalladas para ayudar a tus invitados a elegir
- Varía los precios para que haya opciones para todos los presupuestos
- Revisa regularmente tu panel para ver qué regalos han sido comprados
- Actualiza tu lista conforme cambien tus necesidades

🤝 ¿NECESITAS AYUDA?
Nuestro equipo está aquí para ayudarte. Si tienes alguna pregunta o necesitas asistencia, no dudes en contactarnos en ${supportEmail}. Responderemos lo antes posible.

🔗 TU ENLACE PERSONALIZADO:
Comparte este enlace con tus invitados:
${registryUrl}

Gracias por confiar en MesaLista para este momento tan importante. ¡Les deseamos mucha felicidad en su camino juntos! 💕

Con cariño,
El equipo de MesaLista

---

¿Necesitas ayuda? Contáctanos en ${supportEmail}

© 2026 MesaLista. Todos los derechos reservados.
    `.trim();
  }

  /**
   * Generate HTML email template for gift list creation confirmation
   */
  static generateGiftListCreationEmailHTML(data: {
    userName: string;
    userEmail: string;
    giftListTitle: string;
    coupleName: string;
    eventDate: Date;
    planType: string;
    amount: number;
    dashboardUrl: string;
    listUrl: string;
  }): string {
    const formatCurrency = (amount: number) => this.formatCurrency(amount, 'MXN');
    const formatDate = (date: Date) => this.formatDate(date);

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>¡Tu Nueva Lista de Regalos Está Lista!</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f7;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f7; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #d4704a 0%, #c05f3d 100%); padding: 40px 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 300;">¡Tu Nueva Lista Está Lista! 🎉</h1>
            </td>
          </tr>

          <!-- Success Message -->
          <tr>
            <td style="padding: 40px 30px; text-align: center;">
              <div style="width: 80px; height: 80px; background-color: #d4704a; border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
                <span style="color: #ffffff; font-size: 40px;">✓</span>
              </div>
              <h2 style="color: #1d1d1f; margin: 0 0 10px; font-size: 24px; font-weight: 500;">Pago Procesado Exitosamente</h2>
              <p style="color: #86868b; margin: 0; font-size: 16px; line-height: 1.5;">
                Tu pago de <strong style="color: #d4704a;">${formatCurrency(data.amount)}</strong> ha sido confirmado
              </p>
            </td>
          </tr>

          <!-- Gift List Details -->
          <tr>
            <td style="padding: 0 30px 30px;">
              <div style="background-color: #f5f5f7; border-radius: 12px; padding: 24px;">
                <h3 style="color: #1d1d1f; margin: 0 0 20px; font-size: 18px; font-weight: 500;">Detalles de tu Lista</h3>
                
                <table width="100%" cellpadding="8" cellspacing="0">
                  <tr>
                    <td style="color: #86868b; font-size: 14px; padding: 8px 0;">Nombre de la Lista:</td>
                    <td style="color: #1d1d1f; font-size: 14px; font-weight: 500; text-align: right; padding: 8px 0;">${data.giftListTitle}</td>
                  </tr>
                  <tr>
                    <td style="color: #86868b; font-size: 14px; padding: 8px 0;">Pareja:</td>
                    <td style="color: #1d1d1f; font-size: 14px; font-weight: 500; text-align: right; padding: 8px 0;">${data.coupleName}</td>
                  </tr>
                  <tr>
                    <td style="color: #86868b; font-size: 14px; padding: 8px 0;">Fecha del Evento:</td>
                    <td style="color: #1d1d1f; font-size: 14px; font-weight: 500; text-align: right; padding: 8px 0;">${formatDate(data.eventDate)}</td>
                  </tr>
                  <tr>
                    <td style="color: #86868b; font-size: 14px; padding: 8px 0;">Plan:</td>
                    <td style="color: #1d1d1f; font-size: 14px; font-weight: 500; text-align: right; padding: 8px 0;">Plan Fijo - Sin Comisiones</td>
                  </tr>
                </table>
              </div>
            </td>
          </tr>

          <!-- Next Steps -->
          <tr>
            <td style="padding: 0 30px 30px;">
              <h3 style="color: #1d1d1f; margin: 0 0 20px; font-size: 18px; font-weight: 500;">Próximos Pasos</h3>
              
              <div style="margin-bottom: 16px;">
                <div style="display: flex; align-items: start; margin-bottom: 12px;">
                  <span style="color: #d4704a; font-size: 20px; margin-right: 12px;">1️⃣</span>
                  <div>
                    <strong style="color: #1d1d1f; font-size: 15px; display: block; margin-bottom: 4px;">Agrega tus regalos</strong>
                    <p style="color: #86868b; margin: 0; font-size: 14px; line-height: 1.5;">Crea tu lista con fotos, descripciones y precios</p>
                  </div>
                </div>
              </div>

              <div style="margin-bottom: 16px;">
                <div style="display: flex; align-items: start; margin-bottom: 12px;">
                  <span style="color: #d4704a; font-size: 20px; margin-right: 12px;">2️⃣</span>
                  <div>
                    <strong style="color: #1d1d1f; font-size: 15px; display: block; margin-bottom: 4px;">Crea tu invitación digital</strong>
                    <p style="color: #86868b; margin: 0; font-size: 14px; line-height: 1.5;">Diseña una hermosa invitación para tu evento</p>
                  </div>
                </div>
              </div>

              <div style="margin-bottom: 16px;">
                <div style="display: flex; align-items: start;">
                  <span style="color: #d4704a; font-size: 20px; margin-right: 12px;">3️⃣</span>
                  <div>
                    <strong style="color: #1d1d1f; font-size: 15px; display: block; margin-bottom: 4px;">Comparte con tus invitados</strong>
                    <p style="color: #86868b; margin: 0; font-size: 14px; line-height: 1.5;">Envía el enlace a familiares y amigos</p>
                  </div>
                </div>
              </div>
            </td>
          </tr>

          <!-- Action Buttons -->
          <tr>
            <td style="padding: 0 30px 40px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding-bottom: 12px;">
                    <a href="${data.dashboardUrl}" style="display: block; background-color: #d4704a; color: #ffffff; text-decoration: none; padding: 16px 24px; border-radius: 12px; text-align: center; font-size: 16px; font-weight: 500;">
                      Ir a Mi Panel de Control
                    </a>
                  </td>
                </tr>
                <tr>
                  <td>
                    <a href="${data.listUrl}" style="display: block; background-color: #f5f5f7; color: #1d1d1f; text-decoration: none; padding: 16px 24px; border-radius: 12px; text-align: center; font-size: 16px; font-weight: 500;">
                      Ver Mi Lista Pública
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f5f5f7; padding: 30px; text-align: center; border-top: 1px solid #e5e5e7;">
              <p style="color: #86868b; margin: 0 0 10px; font-size: 14px;">
                ¿Necesitas ayuda? Contáctanos en <a href="mailto:info@mesalista.com.mx" style="color: #d4704a; text-decoration: none;">info@mesalista.com.mx</a>
              </p>
              <p style="color: #86868b; margin: 0; font-size: 12px;">
                © 2026 MesaLista. Todos los derechos reservados.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim();
  }

  /**
   * Generate plain text email for gift list creation confirmation
   */
  static generateGiftListCreationEmailText(data: {
    userName: string;
    userEmail: string;
    giftListTitle: string;
    coupleName: string;
    eventDate: Date;
    planType: string;
    amount: number;
    dashboardUrl: string;
    listUrl: string;
  }): string {
    const formatCurrency = (amount: number) => this.formatCurrency(amount, 'MXN');
    const formatDate = (date: Date) => this.formatDate(date);

    return `
¡TU NUEVA LISTA DE REGALOS ESTÁ LISTA! 🎉

✓ PAGO PROCESADO EXITOSAMENTE

Tu pago de ${formatCurrency(data.amount)} ha sido confirmado y tu nueva lista de regalos ya está activa.

DETALLES DE TU LISTA:
- Nombre de la Lista: ${data.giftListTitle}
- Pareja: ${data.coupleName}
- Fecha del Evento: ${formatDate(data.eventDate)}
- Plan: Plan Fijo - Sin Comisiones

PRÓXIMOS PASOS:

1️⃣ AGREGA TUS REGALOS
Crea tu lista con fotos, descripciones y precios. Puedes agregar desde electrodomésticos hasta experiencias de viaje.

2️⃣ CREA TU INVITACIÓN DIGITAL
Diseña una hermosa invitación para tu evento y compártela con tus invitados.

3️⃣ COMPARTE CON TUS INVITADOS
Envía el enlace a familiares y amigos para que puedan ver y comprar tus regalos.

ENLACES IMPORTANTES:
- Panel de Control: ${data.dashboardUrl}
- Tu Lista Pública: ${data.listUrl}

💡 CONSEJOS ÚTILES:
- Agrega fotos de alta calidad a tus regalos
- Incluye descripciones detalladas
- Varía los precios para todos los presupuestos
- Revisa regularmente tu panel

¿NECESITAS AYUDA?
Contáctanos en info@mesalista.com.mx

Con cariño,
El equipo de MesaLista

---
© 2026 MesaLista. Todos los derechos reservados.
    `.trim();
  }

  /**
   * Marketing Email 1: Welcome & Feature Overview
   * Purpose: Remind users why they chose MesaLista and introduce key features
   * Best Practice: Send 1-2 days after registration
   */
  static generateMarketingEmail1HTML(firstName: string, coupleSlug: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>¡Bienvenido a MesaLista!</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #374151; margin: 0; padding: 0; background-color: #f9fafb;">
        <div style="max-width: 600px; margin: 0 auto; background-color: white; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #d4704a 0%, #d4a574 100%); color: white; padding: 40px 24px; text-align: center;">
            <h1 style="margin: 0; font-size: 32px; font-weight: bold;">¡Hola ${firstName}! 👋</h1>
            <p style="margin: 12px 0 0 0; font-size: 18px; opacity: 0.95;">Bienvenido a MesaLista</p>
          </div>

          <!-- Content -->
          <div style="padding: 40px 24px;">
            <p style="font-size: 18px; margin: 0 0 24px 0; color: #1f2937;">
              Nos emociona que hayas elegido <strong>MesaLista</strong> para crear tu mesa de regalos. Estás a punto de descubrir lo fácil que es gestionar todo en un solo lugar.
            </p>

            <div style="background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 20px; margin-bottom: 32px; border-radius: 8px;">
              <p style="margin: 0; color: #1e40af; font-size: 16px;">
                <strong>💡 ¿Sabías que?</strong> Con MesaLista puedes tener tu mesa de regalos lista en solo 5 minutos usando nuestras listas prediseñadas.
              </p>
            </div>

            <h2 style="color: #1f2937; margin: 32px 0 20px 0; font-size: 24px;">Todo lo que puedes hacer:</h2>

            <!-- Feature 1 -->
            <div style="margin-bottom: 24px; padding: 20px; background-color: #f9fafb; border-radius: 12px;">
              <div style="display: flex; align-items: start;">
                <div style="font-size: 32px; margin-right: 16px;">🎁</div>
                <div>
                  <h3 style="margin: 0 0 8px 0; color: #1f2937; font-size: 18px;">Listas Prediseñadas</h3>
                  <p style="margin: 0; color: #6b7280; line-height: 1.6;">
                    Elige entre 6+ colecciones curadas por expertos: Luna de Miel, Hogar Nuevo, Redecoración y más. Más de 200 productos premium listos para agregar.
                  </p>
                </div>
              </div>
            </div>

            <!-- Feature 2 -->
            <div style="margin-bottom: 24px; padding: 20px; background-color: #f9fafb; border-radius: 12px;">
              <div style="display: flex; align-items: start;">
                <div style="font-size: 32px; margin-right: 16px;">💌</div>
                <div>
                  <h3 style="margin: 0 0 8px 0; color: #1f2937; font-size: 18px;">Invitaciones Digitales</h3>
                  <p style="margin: 0; color: #6b7280; line-height: 1.6;">
                    Crea invitaciones hermosas y compartibles con plantillas premium. Incluye el enlace directo a tu mesa de regalos.
                  </p>
                </div>
              </div>
            </div>

            <!-- Feature 3 -->
            <div style="margin-bottom: 24px; padding: 20px; background-color: #f9fafb; border-radius: 12px;">
              <div style="display: flex; align-items: start;">
                <div style="font-size: 32px; margin-right: 16px;">✅</div>
                <div>
                  <h3 style="margin: 0 0 8px 0; color: #1f2937; font-size: 18px;">Gestión de RSVPs</h3>
                  <p style="margin: 0; color: #6b7280; line-height: 1.6;">
                    Administra confirmaciones de asistencia con códigos únicos. Tus invitados pueden confirmar y dejar mensajes especiales.
                  </p>
                </div>
              </div>
            </div>

            <!-- Feature 4 -->
            <div style="margin-bottom: 32px; padding: 20px; background-color: #f9fafb; border-radius: 12px;">
              <div style="display: flex; align-items: start;">
                <div style="font-size: 32px; margin-right: 16px;">📊</div>
                <div>
                  <h3 style="margin: 0 0 8px 0; color: #1f2937; font-size: 18px;">Estadísticas en Tiempo Real</h3>
                  <p style="margin: 0; color: #6b7280; line-height: 1.6;">
                    Ve quién ha comprado qué, cuánto has recaudado y el progreso de tu lista con análisis detallados.
                  </p>
                </div>
              </div>
            </div>

            <!-- CTA Button -->
            <div style="text-align: center; margin: 40px 0;">
              <a href="https://mesalista.com.mx/${coupleSlug}/gestionar" 
                 style="display: inline-block; background: linear-gradient(135deg, #d4704a 0%, #d4a574 100%); color: white; padding: 16px 40px; text-decoration: none; border-radius: 50px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(212, 112, 74, 0.3);">
                Comenzar Ahora →
              </a>
            </div>

            <div style="background-color: #fef3c7; border: 1px solid #fbbf24; border-radius: 8px; padding: 20px; margin-top: 32px;">
              <p style="margin: 0; color: #92400e; font-size: 14px; text-align: center;">
                <strong>🎉 Sin costo inicial</strong> - Solo pagas una pequeña comisión cuando recibes regalos. ¡Cero riesgo para ti!
              </p>
            </div>
          </div>

          <!-- Footer -->
          <div style="background-color: #f9fafb; padding: 24px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 14px;">¿Necesitas ayuda? Escríbenos a info@mesalista.com.mx</p>
            <p style="margin: 0; color: #6b7280; font-size: 14px;">
              <strong>MesaLista</strong> - Haciendo los regalos de boda más fáciles
            </p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  static generateMarketingEmail1Text(firstName: string, coupleSlug: string): string {
    return `
¡HOLA ${firstName.toUpperCase()}! 👋

Bienvenido a MesaLista

Nos emociona que hayas elegido MesaLista para crear tu mesa de regalos. Estás a punto de descubrir lo fácil que es gestionar todo en un solo lugar.

💡 ¿SABÍAS QUE?
Con MesaLista puedes tener tu mesa de regalos lista en solo 5 minutos usando nuestras listas prediseñadas.

TODO LO QUE PUEDES HACER:

🎁 LISTAS PREDISEÑADAS
Elige entre 6+ colecciones curadas por expertos: Luna de Miel, Hogar Nuevo, Redecoración y más. Más de 200 productos premium listos para agregar.

💌 INVITACIONES DIGITALES
Crea invitaciones hermosas y compartibles con plantillas premium. Incluye el enlace directo a tu mesa de regalos.

✅ GESTIÓN DE RSVPs
Administra confirmaciones de asistencia con códigos únicos. Tus invitados pueden confirmar y dejar mensajes especiales.

📊 ESTADÍSTICAS EN TIEMPO REAL
Ve quién ha comprado qué, cuánto has recaudado y el progreso de tu lista con análisis detallados.

COMENZAR AHORA:
https://mesalista.com.mx/${coupleSlug}/gestionar

🎉 SIN COSTO INICIAL
Solo pagas una pequeña comisión cuando recibes regalos. ¡Cero riesgo para ti!

¿Necesitas ayuda? Escríbenos a info@mesalista.com.mx

Con cariño,
El equipo de MesaLista
    `.trim();
  }

  /**
   * Marketing Email 2: Quick Start Guide
   * Purpose: Help users take their first steps with actionable tips
   * Best Practice: Send 3-4 days after registration if no activity
   */
  static generateMarketingEmail2HTML(firstName: string, coupleSlug: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Tu Mesa de Regalos en 3 Pasos</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #374151; margin: 0; padding: 0; background-color: #f9fafb;">
        <div style="max-width: 600px; margin: 0 auto; background-color: white; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); color: white; padding: 40px 24px; text-align: center;">
            <h1 style="margin: 0; font-size: 32px; font-weight: bold;">Tu Mesa Lista en 3 Pasos</h1>
            <p style="margin: 12px 0 0 0; font-size: 18px; opacity: 0.95;">Guía rápida para ${firstName}</p>
          </div>

          <!-- Content -->
          <div style="padding: 40px 24px;">
            <p style="font-size: 18px; margin: 0 0 32px 0; color: #1f2937;">
              Hola ${firstName}, notamos que aún no has completado tu mesa de regalos. ¡No te preocupes! Te mostramos cómo hacerlo en minutos.
            </p>

            <!-- Step 1 -->
            <div style="margin-bottom: 32px; position: relative; padding-left: 60px;">
              <div style="position: absolute; left: 0; top: 0; width: 48px; height: 48px; background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-size: 24px; font-weight: bold;">1</div>
              <h3 style="margin: 0 0 12px 0; color: #1f2937; font-size: 20px;">Explora las Listas Prediseñadas</h3>
              <p style="margin: 0 0 12px 0; color: #6b7280; line-height: 1.6;">
                Ahorra tiempo explorando nuestras 6+ colecciones curadas. Desde Luna de Miel hasta Hogar Nuevo, tenemos todo lo que necesitas.
              </p>
              <a href="https://mesalista.com.mx/colecciones" 
                 style="color: #3b82f6; text-decoration: none; font-weight: 600; font-size: 14px;">
                Ver Colecciones →
              </a>
            </div>

            <!-- Step 2 -->
            <div style="margin-bottom: 32px; position: relative; padding-left: 60px;">
              <div style="position: absolute; left: 0; top: 0; width: 48px; height: 48px; background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-size: 24px; font-weight: bold;">2</div>
              <h3 style="margin: 0 0 12px 0; color: #1f2937; font-size: 20px;">Agrega Regalos a Tu Lista</h3>
              <p style="margin: 0 0 12px 0; color: #6b7280; line-height: 1.6;">
                Selecciona productos de nuestras colecciones o agrega los tuyos propios. Incluye fotos, descripciones y precios para cada regalo.
              </p>
              <a href="https://mesalista.com.mx/${coupleSlug}/gestionar?addGift=true" 
                 style="color: #3b82f6; text-decoration: none; font-weight: 600; font-size: 14px;">
                Agregar Regalos →
              </a>
            </div>

            <!-- Step 3 -->
            <div style="margin-bottom: 32px; position: relative; padding-left: 60px;">
              <div style="position: absolute; left: 0; top: 0; width: 48px; height: 48px; background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-size: 24px; font-weight: bold;">3</div>
              <h3 style="margin: 0 0 12px 0; color: #1f2937; font-size: 20px;">Comparte con Tus Invitados</h3>
              <p style="margin: 0 0 12px 0; color: #6b7280; line-height: 1.6;">
                Crea una invitación digital hermosa o simplemente comparte tu enlace único. Tus invitados podrán ver y comprar regalos al instante.
              </p>
              <a href="https://mesalista.com.mx/${coupleSlug}/regalos" 
                 style="color: #3b82f6; text-decoration: none; font-weight: 600; font-size: 14px;">
                Ver Mi Mesa →
              </a>
            </div>

            <!-- CTA Button -->
            <div style="text-align: center; margin: 40px 0;">
              <a href="https://mesalista.com.mx/${coupleSlug}/gestionar" 
                 style="display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); color: white; padding: 16px 40px; text-decoration: none; border-radius: 50px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);">
                Completar Mi Mesa Ahora →
              </a>
            </div>

            <!-- Pro Tips -->
            <div style="background-color: #f0fdf4; border: 1px solid #86efac; border-radius: 12px; padding: 24px; margin-top: 32px;">
              <h3 style="margin: 0 0 16px 0; color: #166534; font-size: 18px;">💡 Tips Pro:</h3>
              <ul style="margin: 0; padding-left: 20px; color: #166534;">
                <li style="margin-bottom: 8px;">Incluye regalos de diferentes rangos de precio (desde $500 hasta $5,000+)</li>
                <li style="margin-bottom: 8px;">Agrega fotos de alta calidad para hacer tus regalos más atractivos</li>
                <li style="margin-bottom: 8px;">Usa las descripciones para explicar por qué quieres cada regalo</li>
                <li>Revisa tu panel regularmente para ver el progreso</li>
              </ul>
            </div>
          </div>

          <!-- Footer -->
          <div style="background-color: #f9fafb; padding: 24px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 14px;">¿Tienes preguntas? Estamos aquí para ayudarte</p>
            <p style="margin: 0; color: #6b7280; font-size: 14px;">
              <strong>MesaLista</strong> - info@mesalista.com.mx
            </p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  static generateMarketingEmail2Text(firstName: string, coupleSlug: string): string {
    return `
TU MESA LISTA EN 3 PASOS

Guía rápida para ${firstName}

Hola ${firstName}, notamos que aún no has completado tu mesa de regalos. ¡No te preocupes! Te mostramos cómo hacerlo en minutos.

PASO 1: EXPLORA LAS LISTAS PREDISEÑADAS
Ahorra tiempo explorando nuestras 6+ colecciones curadas. Desde Luna de Miel hasta Hogar Nuevo, tenemos todo lo que necesitas.
→ Ver Colecciones: https://mesalista.com.mx/colecciones

PASO 2: AGREGA REGALOS A TU LISTA
Selecciona productos de nuestras colecciones o agrega los tuyos propios. Incluye fotos, descripciones y precios para cada regalo.
→ Agregar Regalos: https://mesalista.com.mx/${coupleSlug}/gestionar?addGift=true

PASO 3: COMPARTE CON TUS INVITADOS
Crea una invitación digital hermosa o simplemente comparte tu enlace único. Tus invitados podrán ver y comprar regalos al instante.
→ Ver Mi Mesa: https://mesalista.com.mx/${coupleSlug}/regalos

COMPLETAR MI MESA AHORA:
https://mesalista.com.mx/${coupleSlug}/gestionar

💡 TIPS PRO:
- Incluye regalos de diferentes rangos de precio (desde $500 hasta $5,000+)
- Agrega fotos de alta calidad para hacer tus regalos más atractivos
- Usa las descripciones para explicar por qué quieres cada regalo
- Revisa tu panel regularmente para ver el progreso

¿Tienes preguntas? Estamos aquí para ayudarte
info@mesalista.com.mx

Con cariño,
El equipo de MesaLista
    `.trim();
  }

  /**
   * Marketing Email 3: Social Proof & Success Stories
   * Purpose: Build trust with testimonials and showcase platform benefits
   * Best Practice: Send 7 days after registration
   */
  static generateMarketingEmail3HTML(firstName: string, coupleSlug: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Parejas como tú están usando MesaLista</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #374151; margin: 0; padding: 0; background-color: #f9fafb;">
        <div style="max-width: 600px; margin: 0 auto; background-color: white; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #ec4899 0%, #f97316 100%); color: white; padding: 40px 24px; text-align: center;">
            <h1 style="margin: 0; font-size: 32px; font-weight: bold;">Historias de Éxito</h1>
            <p style="margin: 12px 0 0 0; font-size: 18px; opacity: 0.95;">Parejas reales, resultados reales</p>
          </div>

          <!-- Content -->
          <div style="padding: 40px 24px;">
            <p style="font-size: 18px; margin: 0 0 32px 0; color: #1f2937;">
              Hola ${firstName}, ¿sabías que cientos de parejas ya están usando MesaLista para hacer sus eventos más especiales? Aquí te compartimos algunas historias.
            </p>

            <!-- Testimonial 1 -->
            <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 24px; margin-bottom: 24px; border-radius: 8px;">
              <p style="margin: 0 0 16px 0; color: #92400e; font-size: 16px; font-style: italic; line-height: 1.7;">
                "MesaLista transformó completamente nuestra experiencia de boda. En solo 10 minutos teníamos nuestra lista completa usando las colecciones prediseñadas. ¡Recibimos más de $85,000 en regalos!"
              </p>
              <div style="display: flex; align-items: center;">
                <div style="width: 48px; height: 48px; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-size: 20px; margin-right: 12px;">❤️</div>
                <div>
                  <p style="margin: 0; color: #92400e; font-weight: 600;">María y Carlos</p>
                  <p style="margin: 0; color: #92400e; font-size: 14px;">Ciudad de México • Boda 2025</p>
                </div>
              </div>
            </div>

            <!-- Testimonial 2 -->
            <div style="background-color: #dbeafe; border-left: 4px solid #3b82f6; padding: 24px; margin-bottom: 24px; border-radius: 8px;">
              <p style="margin: 0 0 16px 0; color: #1e40af; font-size: 16px; font-style: italic; line-height: 1.7;">
                "Las invitaciones digitales son hermosas y el sistema de RSVP nos ahorró muchísimo tiempo. Pudimos gestionar 150 invitados sin ningún problema. ¡Súper recomendado!"
              </p>
              <div style="display: flex; align-items: center;">
                <div style="width: 48px; height: 48px; background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-size: 20px; margin-right: 12px;">💕</div>
                <div>
                  <p style="margin: 0; color: #1e40af; font-weight: 600;">Ana y Luis</p>
                  <p style="margin: 0; color: #1e40af; font-size: 14px;">Guadalajara • Boda 2025</p>
                </div>
              </div>
            </div>

            <!-- Testimonial 3 -->
            <div style="background-color: #f0fdf4; border-left: 4px solid #22c55e; padding: 24px; margin-bottom: 32px; border-radius: 8px;">
              <p style="margin: 0 0 16px 0; color: #166534; font-size: 16px; font-style: italic; line-height: 1.7;">
                "Lo mejor es que no pagamos nada por adelantado. Solo una pequeña comisión cuando recibimos regalos. ¡Cero riesgo y máxima flexibilidad!"
              </p>
              <div style="display: flex; align-items: center;">
                <div style="width: 48px; height: 48px; background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-size: 20px; margin-right: 12px;">💚</div>
                <div>
                  <p style="margin: 0; color: #166534; font-weight: 600;">Carmen y Roberto</p>
                  <p style="margin: 0; color: #166534; font-size: 14px;">Monterrey • Boda 2026</p>
                </div>
              </div>
            </div>

            <!-- Stats Section -->
            <div style="background: linear-gradient(135deg, #ec4899 0%, #f97316 100%); border-radius: 16px; padding: 32px; margin-bottom: 32px; text-align: center;">
              <h3 style="margin: 0 0 24px 0; color: white; font-size: 22px;">MesaLista en Números</h3>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                <div style="background: rgba(255, 255, 255, 0.15); backdrop-filter: blur(10px); border-radius: 12px; padding: 20px;">
                  <p style="margin: 0; color: white; font-size: 32px; font-weight: bold;">500+</p>
                  <p style="margin: 8px 0 0 0; color: white; font-size: 14px; opacity: 0.9;">Parejas Felices</p>
                </div>
                <div style="background: rgba(255, 255, 255, 0.15); backdrop-filter: blur(10px); border-radius: 12px; padding: 20px;">
                  <p style="margin: 0; color: white; font-size: 32px; font-weight: bold;">95%</p>
                  <p style="margin: 8px 0 0 0; color: white; font-size: 14px; opacity: 0.9;">Satisfacción</p>
                </div>
                <div style="background: rgba(255, 255, 255, 0.15); backdrop-filter: blur(10px); border-radius: 12px; padding: 20px;">
                  <p style="margin: 0; color: white; font-size: 32px; font-weight: bold;">5 min</p>
                  <p style="margin: 8px 0 0 0; color: white; font-size: 14px; opacity: 0.9;">Setup Promedio</p>
                </div>
                <div style="background: rgba(255, 255, 255, 0.15); backdrop-filter: blur(10px); border-radius: 12px; padding: 20px;">
                  <p style="margin: 0; color: white; font-size: 32px; font-weight: bold;">$0</p>
                  <p style="margin: 8px 0 0 0; color: white; font-size: 14px; opacity: 0.9;">Costo Inicial</p>
                </div>
              </div>
            </div>

            <!-- CTA Button -->
            <div style="text-align: center; margin: 40px 0;">
              <p style="margin: 0 0 20px 0; color: #6b7280; font-size: 16px;">¿Listo para unirte a estas parejas exitosas?</p>
              <a href="https://mesalista.com.mx/${coupleSlug}/gestionar" 
                 style="display: inline-block; background: linear-gradient(135deg, #ec4899 0%, #f97316 100%); color: white; padding: 16px 40px; text-decoration: none; border-radius: 50px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(236, 72, 153, 0.3);">
                Crear Mi Mesa Ahora →
              </a>
            </div>

            <div style="background-color: #eff6ff; border: 1px solid #93c5fd; border-radius: 8px; padding: 20px; margin-top: 32px; text-align: center;">
              <p style="margin: 0; color: #1e40af; font-size: 14px;">
                <strong>🎁 Garantía MesaLista:</strong> Si no estás satisfecho en los primeros 30 días, te ayudamos a migrar tu lista sin costo alguno.
              </p>
            </div>
          </div>

          <!-- Footer -->
          <div style="background-color: #f9fafb; padding: 24px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 14px;">¿Quieres compartir tu historia? Escríbenos</p>
            <p style="margin: 0; color: #6b7280; font-size: 14px;">
              <strong>MesaLista</strong> - info@mesalista.com.mx
            </p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  static generateMarketingEmail3Text(firstName: string, coupleSlug: string): string {
    return `
HISTORIAS DE ÉXITO

Parejas reales, resultados reales

Hola ${firstName}, ¿sabías que cientos de parejas ya están usando MesaLista para hacer sus eventos más especiales? Aquí te compartimos algunas historias.

❤️ MARÍA Y CARLOS - CIUDAD DE MÉXICO
"MesaLista transformó completamente nuestra experiencia de boda. En solo 10 minutos teníamos nuestra lista completa usando las colecciones prediseñadas. ¡Recibimos más de $85,000 en regalos!"

💕 ANA Y LUIS - GUADALAJARA
"Las invitaciones digitales son hermosas y el sistema de RSVP nos ahorró muchísimo tiempo. Pudimos gestionar 150 invitados sin ningún problema. ¡Súper recomendado!"

💚 CARMEN Y ROBERTO - MONTERREY
"Lo mejor es que no pagamos nada por adelantado. Solo una pequeña comisión cuando recibimos regalos. ¡Cero riesgo y máxima flexibilidad!"

MESALISTA EN NÚMEROS:

500+ Parejas Felices
95% Satisfacción
5 min Setup Promedio
$0 Costo Inicial

¿Listo para unirte a estas parejas exitosas?

CREAR MI MESA AHORA:
https://mesalista.com.mx/${coupleSlug}/gestionar

🎁 GARANTÍA MESALISTA:
Si no estás satisfecho en los primeros 30 días, te ayudamos a migrar tu lista sin costo alguno.

¿Quieres compartir tu historia? Escríbenos
info@mesalista.com.mx

Con cariño,
El equipo de MesaLista
    `.trim();
  }

  /**
   * Marketing Email 4: Re-engagement & Special Offer
   * Purpose: Final push to activate dormant users with urgency
   * Best Practice: Send 14 days after registration if still inactive
   */
  static generateMarketingEmail4HTML(firstName: string, coupleSlug: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>¿Aún no has completado tu mesa?</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #374151; margin: 0; padding: 0; background-color: #f9fafb;">
        <div style="max-width: 600px; margin: 0 auto; background-color: white; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%); color: white; padding: 40px 24px; text-align: center;">
            <h1 style="margin: 0; font-size: 32px; font-weight: bold;">Te extrañamos, ${firstName} 💜</h1>
            <p style="margin: 12px 0 0 0; font-size: 18px; opacity: 0.95;">Tu mesa de regalos te está esperando</p>
          </div>

          <!-- Content -->
          <div style="padding: 40px 24px;">
            <p style="font-size: 18px; margin: 0 0 24px 0; color: #1f2937;">
              Hola ${firstName}, notamos que aún no has completado tu mesa de regalos. Sabemos que planear un evento puede ser abrumador, pero estamos aquí para hacerlo más fácil.
            </p>

            <!-- Urgency Box -->
            <div style="background: linear-gradient(135deg, #fef3c7 0%, #fed7aa 100%); border: 2px solid #f59e0b; border-radius: 16px; padding: 24px; margin-bottom: 32px; text-align: center;">
              <div style="font-size: 48px; margin-bottom: 12px;">⏰</div>
              <h3 style="margin: 0 0 12px 0; color: #92400e; font-size: 22px;">¡No dejes pasar más tiempo!</h3>
              <p style="margin: 0; color: #92400e; font-size: 16px; line-height: 1.6;">
                Mientras más pronto compartas tu mesa de regalos, más tiempo tendrán tus invitados para elegir el regalo perfecto.
              </p>
            </div>

            <h2 style="color: #1f2937; margin: 32px 0 20px 0; font-size: 24px; text-align: center;">¿Qué te está deteniendo?</h2>

            <!-- Common Objections -->
            <div style="margin-bottom: 24px; padding: 20px; background-color: #f9fafb; border-radius: 12px; border-left: 4px solid #8b5cf6;">
              <h3 style="margin: 0 0 8px 0; color: #1f2937; font-size: 16px;">❓ "No tengo tiempo para crear una lista completa"</h3>
              <p style="margin: 0; color: #6b7280; line-height: 1.6; font-size: 14px;">
                <strong>Solución:</strong> Usa nuestras listas prediseñadas. En 5 minutos tendrás una lista completa con productos curados por expertos. ¡Solo elige y listo!
              </p>
            </div>

            <div style="margin-bottom: 24px; padding: 20px; background-color: #f9fafb; border-radius: 12px; border-left: 4px solid #ec4899;">
              <h3 style="margin: 0 0 8px 0; color: #1f2937; font-size: 16px;">❓ "Me preocupa el costo"</h3>
              <p style="margin: 0; color: #6b7280; line-height: 1.6; font-size: 14px;">
                <strong>Solución:</strong> Con el plan de comisión, ¡no pagas nada por adelantado! Solo una pequeña comisión cuando recibes regalos. Cero riesgo para ti.
              </p>
            </div>

            <div style="margin-bottom: 24px; padding: 20px; background-color: #f9fafb; border-radius: 12px; border-left: 4px solid #3b82f6;">
              <h3 style="margin: 0 0 8px 0; color: #1f2937; font-size: 16px;">❓ "No sé qué regalos pedir"</h3>
              <p style="margin: 0; color: #6b7280; line-height: 1.6; font-size: 14px;">
                <strong>Solución:</strong> Nuestras 6+ colecciones tienen más de 200 productos premium seleccionados. Desde viajes hasta electrodomésticos, tenemos ideas para todos los gustos.
              </p>
            </div>

            <div style="margin-bottom: 32px; padding: 20px; background-color: #f9fafb; border-radius: 12px; border-left: 4px solid #22c55e;">
              <h3 style="margin: 0 0 8px 0; color: #1f2937; font-size: 16px;">❓ "Es complicado de usar"</h3>
              <p style="margin: 0; color: #6b7280; line-height: 1.6; font-size: 14px;">
                <strong>Solución:</strong> MesaLista es tan fácil como usar Instagram. Interfaz intuitiva, sin curva de aprendizaje. Y si necesitas ayuda, nuestro equipo está a un email de distancia.
              </p>
            </div>

            <!-- Special Offer -->
            <div style="background: linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%); border-radius: 16px; padding: 32px; margin-bottom: 32px; text-align: center; color: white;">
              <div style="font-size: 48px; margin-bottom: 16px;">🎁</div>
              <h3 style="margin: 0 0 16px 0; font-size: 24px;">Oferta Especial para Ti</h3>
              <p style="margin: 0 0 24px 0; font-size: 16px; opacity: 0.95; line-height: 1.6;">
                Completa tu mesa de regalos en los próximos 7 días y recibe <strong>soporte prioritario gratuito</strong> durante todo tu evento. Además, te ayudamos a crear tu primera invitación digital sin costo.
              </p>
              <div style="background: rgba(255, 255, 255, 0.2); backdrop-filter: blur(10px); border-radius: 12px; padding: 16px; display: inline-block;">
                <p style="margin: 0; font-size: 14px; opacity: 0.9;">Valor: $1,500 MXN</p>
                <p style="margin: 4px 0 0 0; font-size: 28px; font-weight: bold;">¡GRATIS!</p>
              </div>
            </div>

            <!-- CTA Button -->
            <div style="text-align: center; margin: 40px 0;">
              <a href="https://mesalista.com.mx/${coupleSlug}/gestionar" 
                 style="display: inline-block; background: linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%); color: white; padding: 18px 48px; text-decoration: none; border-radius: 50px; font-weight: 700; font-size: 18px; box-shadow: 0 6px 16px rgba(139, 92, 246, 0.4); text-transform: uppercase; letter-spacing: 0.5px;">
                Activar Mi Oferta Ahora →
              </a>
              <p style="margin: 16px 0 0 0; color: #6b7280; font-size: 14px;">Oferta válida por 7 días</p>
            </div>

            <!-- Final Push -->
            <div style="background-color: #fef2f2; border: 1px solid #fca5a5; border-radius: 8px; padding: 20px; margin-top: 32px; text-align: center;">
              <p style="margin: 0; color: #991b1b; font-size: 14px; line-height: 1.6;">
                <strong>⚠️ Última oportunidad:</strong> Si no activamos tu cuenta en los próximos 30 días, tendremos que liberar tu espacio para otras parejas en lista de espera.
              </p>
            </div>

            <!-- Help Section -->
            <div style="margin-top: 32px; padding: 24px; background-color: #eff6ff; border-radius: 12px; text-align: center;">
              <h3 style="margin: 0 0 12px 0; color: #1e40af; font-size: 18px;">¿Necesitas ayuda para empezar?</h3>
              <p style="margin: 0 0 16px 0; color: #1e40af; font-size: 14px;">
                Nuestro equipo está listo para ayudarte. Responde a este email o escríbenos directamente.
              </p>
              <a href="mailto:info@mesalista.com.mx?subject=Ayuda%20para%20completar%20mi%20mesa" 
                 style="color: #2563eb; text-decoration: none; font-weight: 600;">
                info@mesalista.com.mx →
              </a>
            </div>
          </div>

          <!-- Footer -->
          <div style="background-color: #f9fafb; padding: 24px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 14px;">Estamos aquí para hacer tu evento inolvidable</p>
            <p style="margin: 0; color: #6b7280; font-size: 14px;">
              <strong>MesaLista</strong> - Tu aliado en momentos especiales
            </p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  static generateMarketingEmail4Text(firstName: string, coupleSlug: string): string {
    return `
TE EXTRAÑAMOS, ${firstName.toUpperCase()} 💜

Tu mesa de regalos te está esperando

Hola ${firstName}, notamos que aún no has completado tu mesa de regalos. Sabemos que planear un evento puede ser abrumador, pero estamos aquí para hacerlo más fácil.

⏰ ¡NO DEJES PASAR MÁS TIEMPO!
Mientras más pronto compartas tu mesa de regalos, más tiempo tendrán tus invitados para elegir el regalo perfecto.

¿QUÉ TE ESTÁ DETENIENDO?

❓ "No tengo tiempo para crear una lista completa"
SOLUCIÓN: Usa nuestras listas prediseñadas. En 5 minutos tendrás una lista completa con productos curados por expertos. ¡Solo elige y listo!

❓ "Me preocupa el costo"
SOLUCIÓN: Con el plan de comisión, ¡no pagas nada por adelantado! Solo una pequeña comisión cuando recibes regalos. Cero riesgo para ti.

❓ "No sé qué regalos pedir"
SOLUCIÓN: Nuestras 6+ colecciones tienen más de 200 productos premium seleccionados. Desde viajes hasta electrodomésticos, tenemos ideas para todos los gustos.

❓ "Es complicado de usar"
SOLUCIÓN: MesaLista es tan fácil como usar Instagram. Interfaz intuitiva, sin curva de aprendizaje. Y si necesitas ayuda, nuestro equipo está a un email de distancia.

🎁 OFERTA ESPECIAL PARA TI

Completa tu mesa de regalos en los próximos 7 días y recibe:
- Soporte prioritario gratuito durante todo tu evento
- Primera invitación digital sin costo
- Valor: $1,500 MXN - ¡GRATIS!

ACTIVAR MI OFERTA AHORA:
https://mesalista.com.mx/${coupleSlug}/gestionar

Oferta válida por 7 días

⚠️ ÚLTIMA OPORTUNIDAD:
Si no activamos tu cuenta en los próximos 30 días, tendremos que liberar tu espacio para otras parejas en lista de espera.

¿NECESITAS AYUDA PARA EMPEZAR?
Nuestro equipo está listo para ayudarte. Responde a este email o escríbenos:
info@mesalista.com.mx

Estamos aquí para hacer tu evento inolvidable

Con cariño,
El equipo de MesaLista
    `.trim();
  }

  /**
   * Generate HTML email template for inactive user warning
   */
  static generateInactiveUserWarningHTML(firstName: string, coupleName: string, giftCount: number): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f5f5f7; }
    .container { max-width: 600px; margin: 40px auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #d4704a 0%, #c25f3a 100%); padding: 40px 30px; text-align: center; }
    .header h1 { color: white; margin: 0; font-size: 28px; font-weight: 600; }
    .content { padding: 40px 30px; }
    .greeting { font-size: 18px; color: #333; margin-bottom: 20px; }
    .message { font-size: 16px; color: #555; line-height: 1.8; margin-bottom: 20px; }
    .warning-box { background: #fff3cd; border-left: 4px solid #ffc107; padding: 20px; margin: 30px 0; border-radius: 8px; }
    .warning-box p { margin: 0; color: #856404; font-size: 15px; }
    .cta-button { display: inline-block; background: #d4704a; color: white; padding: 16px 40px; text-decoration: none; border-radius: 50px; font-weight: 600; font-size: 16px; margin: 20px 0; transition: background 0.3s; }
    .cta-button:hover { background: #c25f3a; }
    .benefits { background: #f8f9fa; padding: 25px; border-radius: 12px; margin: 30px 0; }
    .benefits h3 { color: #d4704a; margin-top: 0; font-size: 18px; }
    .benefits ul { margin: 15px 0; padding-left: 20px; }
    .benefits li { margin: 10px 0; color: #555; }
    .footer { background: #f8f9fa; padding: 30px; text-align: center; color: #888; font-size: 14px; }
    .footer a { color: #d4704a; text-decoration: none; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>¡Tu Mesa de Regalos Te Está Esperando!</h1>
    </div>
    
    <div class="content">
      <p class="greeting">Hola ${firstName},</p>
      
      <p class="message">
        Esperamos que estés disfrutando de la emoción de planear tu evento especial. Notamos que creaste tu cuenta en MesaLista hace más de un mes, pero aún no has comenzado a personalizar tu mesa de regalos.
      </p>

      ${
        giftCount === 0
          ? `
      <p class="message">
        Sabemos que organizar un evento puede ser abrumador, y queremos ayudarte a que este proceso sea lo más sencillo y agradable posible. Tu mesa de regalos está lista para ser configurada, ¡y solo te tomará unos minutos!
      </p>
      `
          : `
      <p class="message">
        Vemos que has agregado ${giftCount} ${giftCount === 1 ? 'regalo' : 'regalos'} a tu lista. ¡Excelente inicio! Sin embargo, notamos que no has iniciado sesión recientemente. Queremos asegurarnos de que aproveches al máximo todas las funcionalidades de MesaLista.
      </p>
      `
      }

      <div class="warning-box">
        <p><strong>⚠️ Importante:</strong> Para mantener la calidad de nuestro servicio y asegurar que todas las cuentas activas reciban la mejor atención, necesitamos que completes la configuración de tu mesa de regalos. Si no vemos actividad en los próximos 30 días, tendremos que cerrar tu cuenta de manera permanente.</p>
      </div>

      <div class="benefits">
        <h3>✨ ¿Por qué completar tu mesa de regalos ahora?</h3>
        <ul>
          <li><strong>Comparte con anticipación:</strong> Tus invitados tendrán más tiempo para elegir el regalo perfecto</li>
          <li><strong>Listas prediseñadas:</strong> Ahorra tiempo con nuestras colecciones curadas por expertos</li>
          <li><strong>Gestión sencilla:</strong> Interfaz intuitiva que hace todo el proceso muy fácil</li>
          <li><strong>Sin costos ocultos:</strong> Transparencia total en nuestros planes y comisiones</li>
          <li><strong>Soporte dedicado:</strong> Nuestro equipo está aquí para ayudarte en cada paso</li>
        </ul>
      </div>

      <p class="message">
        Entendemos que la vida puede ser ocupada, pero no queremos que pierdas esta oportunidad. Estamos aquí para hacer que tu experiencia sea excepcional.
      </p>

      <center>
        <a href="https://mesalista.com.mx/login" class="cta-button">Completar Mi Mesa de Regalos</a>
      </center>

      <p class="message" style="margin-top: 30px;">
        Si tienes alguna pregunta o necesitas ayuda para comenzar, no dudes en responder a este correo. Nuestro equipo estará encantado de asistirte.
      </p>

      <p class="message">
        Con cariño y los mejores deseos para tu evento,<br>
        <strong>El equipo de MesaLista</strong>
      </p>
    </div>
    
    <div class="footer">
      <p>MesaLista - Tu mesa de regalos, hecha simple</p>
      <p><a href="https://mesalista.com.mx">mesalista.com.mx</a> | <a href="mailto:info@mesalista.com.mx">info@mesalista.com.mx</a></p>
    </div>
  </div>
</body>
</html>
    `.trim();
  }

  /**
   * Generate plain text email template for inactive user warning
   */
  static generateInactiveUserWarningText(firstName: string, coupleName: string, giftCount: number): string {
    return `
¡TU MESA DE REGALOS TE ESTÁ ESPERANDO!

Hola ${firstName},

Esperamos que estés disfrutando de la emoción de planear tu evento especial. Notamos que creaste tu cuenta en MesaLista hace más de un mes, pero aún no has comenzado a personalizar tu mesa de regalos.

${
  giftCount === 0
    ? 'Sabemos que organizar un evento puede ser abrumador, y queremos ayudarte a que este proceso sea lo más sencillo y agradable posible. Tu mesa de regalos está lista para ser configurada, ¡y solo te tomará unos minutos!'
    : `Vemos que has agregado ${giftCount} ${giftCount === 1 ? 'regalo' : 'regalos'} a tu lista. ¡Excelente inicio! Sin embargo, notamos que no has iniciado sesión recientemente. Queremos asegurarnos de que aproveches al máximo todas las funcionalidades de MesaLista.`
}

⚠️ IMPORTANTE:
Para mantener la calidad de nuestro servicio y asegurar que todas las cuentas activas reciban la mejor atención, necesitamos que completes la configuración de tu mesa de regalos. Si no vemos actividad en los próximos 30 días, tendremos que cerrar tu cuenta de manera permanente.

✨ ¿POR QUÉ COMPLETAR TU MESA DE REGALOS AHORA?

• Comparte con anticipación: Tus invitados tendrán más tiempo para elegir el regalo perfecto
• Listas prediseñadas: Ahorra tiempo con nuestras colecciones curadas por expertos
• Gestión sencilla: Interfaz intuitiva que hace todo el proceso muy fácil
• Sin costos ocultos: Transparencia total en nuestros planes y comisiones
• Soporte dedicado: Nuestro equipo está aquí para ayudarte en cada paso

Entendemos que la vida puede ser ocupada, pero no queremos que pierdas esta oportunidad. Estamos aquí para hacer que tu experiencia sea excepcional.

COMPLETAR MI MESA DE REGALOS:
https://mesalista.com.mx/login

Si tienes alguna pregunta o necesitas ayuda para comenzar, no dudes en responder a este correo. Nuestro equipo estará encantado de asistirte.

Con cariño y los mejores deseos para tu evento,
El equipo de MesaLista

---
MesaLista - Tu mesa de regalos, hecha simple
mesalista.com.mx | info@mesalista.com.mx
    `.trim();
  }
}
