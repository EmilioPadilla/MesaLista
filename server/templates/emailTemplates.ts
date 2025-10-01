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
}
