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
                        © 2025 MesaLista. Todos los derechos reservados.
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
© 2025 MesaLista. Todos los derechos reservados.
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
              © 2025 MesaLista. Todos los derechos reservados.
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

© 2025 MesaLista. Todos los derechos reservados.
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
              © 2025 MesaLista. Todos los derechos reservados.
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

© 2025 MesaLista. Todos los derechos reservados.
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
    coupleSlug: string;
    planType: 'FIXED' | 'COMMISSION';
    discountCode?: string;
    createdAt: Date;
  }): string {
    const coupleName = `${data.firstName}${data.spouseFirstName ? ' y ' + data.spouseFirstName : ''}`;
    const fullName = `${data.firstName} ${data.lastName}${data.spouseFirstName ? ' y ' + data.spouseFirstName + ' ' + (data.spouseLastName || data.lastName) : ''}`;
    const planTypeText = data.planType === 'FIXED' ? 'Plan Fijo ($2,000 MXN)' : 'Plan Comisión (5%)';
    const registryUrl = `https://mesalista.com.mx/${data.coupleSlug}/regalos`;

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
              <p style="margin: 0 0 8px 0;"><strong>Slug de pareja:</strong> <code style="background-color: #e5e7eb; padding: 2px 6px; border-radius: 4px; font-size: 14px;">${data.coupleSlug}</code></p>
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
    coupleSlug: string;
    planType: 'FIXED' | 'COMMISSION';
    discountCode?: string;
    createdAt: Date;
  }): string {
    const coupleName = `${data.firstName}${data.spouseFirstName ? ' y ' + data.spouseFirstName : ''}`;
    const fullName = `${data.firstName} ${data.lastName}${data.spouseFirstName ? ' y ' + data.spouseFirstName + ' ' + (data.spouseLastName || data.lastName) : ''}`;
    const planTypeText = data.planType === 'FIXED' ? 'Plan Fijo ($2,000 MXN)' : 'Plan Comisión (5%)';
    const registryUrl = `https://mesalista.com.mx/${data.coupleSlug}/regalos`;

    return `
🎉 NUEVA CUENTA CREADA - MESALISTA

Un nuevo usuario se ha registrado en MesaLista

✅ Nueva lista de regalos creada
Fecha: ${this.formatDateTime(data.createdAt)}

INFORMACIÓN DE LA PAREJA:
- Nombre completo: ${fullName}
- Nombre de pareja: ${coupleName}
- Email: ${data.email}
${data.phoneNumber ? `- Teléfono: ${data.phoneNumber}\n` : ''}- Slug de pareja: ${data.coupleSlug}
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
}
