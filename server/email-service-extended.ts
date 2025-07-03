import { sendEmail } from './email-service';

// Función para recuperación de contraseña
export async function sendPasswordResetEmail(email: string, resetToken: string, userName: string = ''): Promise<boolean> {
  const resetLink = `${process.env.APP_URL || 'https://fourone.com.do'}/reset-password?token=${resetToken}`;
  const subject = 'Recuperación de Contraseña - Four One Solutions';
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2563eb;">🔐 Recuperación de Contraseña</h2>
      
      <p>Hola${userName ? ` ${userName}` : ''},</p>
      
      <p>Has solicitado restablecer tu contraseña. Haz clic en el siguiente enlace para crear una nueva contraseña:</p>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${resetLink}" style="background-color: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
          Restablecer Contraseña
        </a>
      </div>
      
      <p style="color: #666; font-size: 14px;">O copia y pega este enlace en tu navegador:</p>
      <p style="color: #2563eb; word-break: break-all;">${resetLink}</p>
      
      <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0;">
        <p style="color: #dc2626; margin: 0;"><strong>Importante:</strong> Este enlace expirará en 1 hora por razones de seguridad.</p>
      </div>
      
      <p>Si no solicitaste este cambio, puedes ignorar este correo de forma segura.</p>
      
      <p>Saludos,<br>
      <strong>Equipo de Four One Solutions</strong></p>
    </div>
  `;
  
  const text = `
Recuperación de Contraseña

Hola${userName ? ` ${userName}` : ''},

Has solicitado restablecer tu contraseña. Visita el siguiente enlace para crear una nueva contraseña:

${resetLink}

Importante: Este enlace expirará en 1 hora por razones de seguridad.

Si no solicitaste este cambio, puedes ignorar este correo de forma segura.

Saludos,
Equipo de Four One Solutions
  `;
  
  return sendEmail({
    to: email,
    subject,
    text,
    html
  });
}

// Función para confirmación de registro
export async function sendRegistrationConfirmationEmail(email: string, userName: string, companyName: string): Promise<boolean> {
  const subject = 'Bienvenido a Four One Solutions - Registro Exitoso';
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #16a34a;">✅ ¡Registro Exitoso!</h2>
      
      <p>Hola ${userName},</p>
      
      <p>¡Bienvenido a Four One Solutions! Tu cuenta para <strong>${companyName}</strong> ha sido creada exitosamente.</p>
      
      <div style="background-color: #f0fdf4; border-left: 4px solid #16a34a; padding: 15px; margin: 20px 0;">
        <h3 style="color: #15803d; margin-top: 0;">Próximos pasos:</h3>
        <ol style="color: #166534;">
          <li>Inicia sesión con tu correo y contraseña</li>
          <li>Completa la configuración inicial de tu empresa</li>
          <li>Explora los módulos disponibles</li>
          <li>Configura tus usuarios y permisos</li>
        </ol>
      </div>
      
      <p><strong>Recursos útiles:</strong></p>
      <ul>
        <li>📚 <a href="${process.env.APP_URL || 'https://fourone.com.do'}/docs" style="color: #2563eb;">Documentación</a></li>
        <li>🎥 <a href="${process.env.APP_URL || 'https://fourone.com.do'}/tutorials" style="color: #2563eb;">Videos tutoriales</a></li>
        <li>💬 <a href="${process.env.APP_URL || 'https://fourone.com.do'}/support" style="color: #2563eb;">Soporte técnico</a></li>
      </ul>
      
      <p>Si tienes alguna pregunta, no dudes en contactarnos.</p>
      
      <p>¡Gracias por elegir Four One Solutions!</p>
      
      <p>Saludos,<br>
      <strong>Equipo de Four One Solutions</strong></p>
    </div>
  `;
  
  const text = `
Bienvenido a Four One Solutions - Registro Exitoso

Hola ${userName},

¡Bienvenido a Four One Solutions! Tu cuenta para ${companyName} ha sido creada exitosamente.

Próximos pasos:
1. Inicia sesión con tu correo y contraseña
2. Completa la configuración inicial de tu empresa
3. Explora los módulos disponibles
4. Configura tus usuarios y permisos

Recursos útiles:
- Documentación: ${process.env.APP_URL || 'https://fourone.com.do'}/docs
- Videos tutoriales: ${process.env.APP_URL || 'https://fourone.com.do'}/tutorials
- Soporte técnico: ${process.env.APP_URL || 'https://fourone.com.do'}/support

Si tienes alguna pregunta, no dudes en contactarnos.

¡Gracias por elegir Four One Solutions!

Saludos,
Equipo de Four One Solutions
  `;
  
  return sendEmail({
    to: email,
    subject,
    text,
    html
  });
}

// Función para notificación de cuenta bloqueada
export async function sendAccountLockoutEmail(
  email: string,
  ipAddress: string,
  attemptCount: number = 5
): Promise<boolean> {
  const subject = '⚠️ Alerta de Seguridad - Cuenta Temporalmente Bloqueada';
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #fee2e2; border: 1px solid #fecaca; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
        <h2 style="color: #991b1b; margin: 0;">⚠️ Alerta de Seguridad</h2>
      </div>
      
      <p>Estimado usuario,</p>
      
      <p>Tu cuenta ha sido <strong>temporalmente bloqueada</strong> debido a ${attemptCount} intentos fallidos de inicio de sesión.</p>
      
      <div style="background-color: #f8fafc; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0;">
        <p style="margin: 0 0 10px 0;"><strong>Detalles del bloqueo:</strong></p>
        <ul style="margin: 0; padding-left: 20px;">
          <li>Fecha y hora: ${new Date().toLocaleString('es-DO')}</li>
          <li>Dirección IP: ${ipAddress}</li>
          <li>Duración del bloqueo: 15 minutos</li>
        </ul>
      </div>
      
      <h3 style="color: #111827;">¿Qué puedes hacer?</h3>
      <ol style="color: #374151;">
        <li>Espera 15 minutos antes de intentar iniciar sesión nuevamente</li>
        <li>Asegúrate de usar las credenciales correctas</li>
        <li>Si olvidaste tu contraseña, usa la opción "¿Olvidaste tu contraseña?"</li>
      </ol>
      
      <div style="background-color: #fef3c7; border: 1px solid #fcd34d; padding: 15px; margin: 20px 0; border-radius: 5px;">
        <p style="margin: 0; color: #92400e;">
          <strong>⚠️ Importante:</strong> Si no reconoces esta actividad, tu cuenta podría estar comprometida. 
          Contacta inmediatamente a nuestro equipo de soporte.
        </p>
      </div>
      
      <p style="text-align: center; margin: 30px 0;">
        <a href="${process.env.APP_URL || 'https://fourone.com.do'}/reset-password" style="background-color: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
          Restablecer Contraseña
        </a>
      </p>
      
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
      
      <p style="color: #6b7280; font-size: 14px;">
        Este es un mensaje automático de seguridad. Si necesitas ayuda, contacta a support@fourone.com.do
      </p>
    </div>
  `;
  
  const text = `
Alerta de Seguridad - Cuenta Temporalmente Bloqueada

Tu cuenta ha sido temporalmente bloqueada debido a ${attemptCount} intentos fallidos de inicio de sesión.

Detalles del bloqueo:
- Fecha y hora: ${new Date().toLocaleString('es-DO')}
- Dirección IP: ${ipAddress}
- Duración del bloqueo: 15 minutos

¿Qué puedes hacer?
1. Espera 15 minutos antes de intentar iniciar sesión nuevamente
2. Asegúrate de usar las credenciales correctas
3. Si olvidaste tu contraseña, visita: ${process.env.APP_URL || 'https://fourone.com.do'}/reset-password

Si no reconoces esta actividad, contacta inmediatamente a support@fourone.com.do
  `;
  
  return sendEmail({
    to: email,
    subject,
    text,
    html
  });
}

// Función para confirmación de pago
export async function sendPaymentConfirmationEmail(
  email: string, 
  userName: string, 
  invoiceNumber: string, 
  amount: number, 
  paymentMethod: string,
  transactionId?: string
): Promise<boolean> {
  const subject = `Confirmación de Pago - Factura ${invoiceNumber}`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #16a34a;">✅ Pago Recibido</h2>
      
      <p>Hola ${userName},</p>
      
      <p>Hemos recibido exitosamente tu pago. A continuación los detalles:</p>
      
      <div style="background-color: #f8fafc; border: 1px solid #e5e7eb; padding: 20px; margin: 20px 0; border-radius: 8px;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; color: #6b7280;">Número de Factura:</td>
            <td style="padding: 8px 0; text-align: right; font-weight: bold;">${invoiceNumber}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #6b7280;">Monto Pagado:</td>
            <td style="padding: 8px 0; text-align: right; font-weight: bold; color: #16a34a;">RD$ ${amount.toLocaleString('es-DO', { minimumFractionDigits: 2 })}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #6b7280;">Método de Pago:</td>
            <td style="padding: 8px 0; text-align: right;">${paymentMethod}</td>
          </tr>
          ${transactionId ? `
          <tr>
            <td style="padding: 8px 0; color: #6b7280;">ID de Transacción:</td>
            <td style="padding: 8px 0; text-align: right; font-family: monospace;">${transactionId}</td>
          </tr>
          ` : ''}
          <tr>
            <td style="padding: 8px 0; color: #6b7280;">Fecha y Hora:</td>
            <td style="padding: 8px 0; text-align: right;">${new Date().toLocaleString('es-DO')}</td>
          </tr>
        </table>
      </div>
      
      <p style="text-align: center; margin: 30px 0;">
        <a href="${process.env.APP_URL || 'https://fourone.com.do'}/invoices/${invoiceNumber}" style="background-color: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
          Ver Factura
        </a>
      </p>
      
      <p style="color: #6b7280; font-size: 14px;">
        Este es un recibo oficial de tu pago. Guarda este correo para tus registros.
      </p>
      
      <p>Gracias por tu pago puntual.</p>
      
      <p>Saludos,<br>
      <strong>Equipo de Four One Solutions</strong></p>
    </div>
  `;
  
  const text = `
Confirmación de Pago - Factura ${invoiceNumber}

Hola ${userName},

Hemos recibido exitosamente tu pago. A continuación los detalles:

Número de Factura: ${invoiceNumber}
Monto Pagado: RD$ ${amount.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
Método de Pago: ${paymentMethod}
${transactionId ? `ID de Transacción: ${transactionId}` : ''}
Fecha y Hora: ${new Date().toLocaleString('es-DO')}

Para ver tu factura, visita: ${process.env.APP_URL || 'https://fourone.com.do'}/invoices/${invoiceNumber}

Este es un recibo oficial de tu pago. Guarda este correo para tus registros.

Gracias por tu pago puntual.

Saludos,
Equipo de Four One Solutions
  `;
  
  return sendEmail({
    to: email,
    subject,
    text,
    html
  });
}

// Función para notificar actualización de credenciales por administrador
export async function sendCredentialsUpdatedEmail(
  email: string, 
  userName: string, 
  adminName: string,
  changes: {
    email?: boolean;
    password?: boolean;
    permissions?: boolean;
    status?: string;
  }
): Promise<boolean> {
  const subject = 'Actualización de Cuenta - Four One Solutions';
  
  const changesList = [];
  if (changes.email) changesList.push('Dirección de correo electrónico');
  if (changes.password) changesList.push('Contraseña');
  if (changes.permissions) changesList.push('Permisos de acceso');
  if (changes.status) changesList.push(`Estado de cuenta (${changes.status})`);
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2563eb;">🔄 Actualización de Cuenta</h2>
      
      <p>Hola ${userName},</p>
      
      <p>El administrador <strong>${adminName}</strong> ha actualizado información importante de tu cuenta.</p>
      
      <div style="background-color: #eff6ff; border-left: 4px solid #2563eb; padding: 15px; margin: 20px 0;">
        <h4 style="color: #1e40af; margin-top: 0;">Cambios realizados:</h4>
        <ul style="color: #1e40af;">
          ${changesList.map(change => `<li>${change}</li>`).join('')}
        </ul>
      </div>
      
      ${changes.password ? `
      <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0;">
        <p style="color: #dc2626; margin: 0;"><strong>Importante:</strong> Tu contraseña ha sido cambiada. Si no reconoces este cambio, contacta inmediatamente al administrador.</p>
      </div>
      ` : ''}
      
      <p><strong>¿Qué hacer ahora?</strong></p>
      <ol>
        <li>Intenta iniciar sesión con tus nuevas credenciales</li>
        <li>Si tienes problemas, contacta al administrador</li>
        <li>Revisa que todos tus accesos funcionen correctamente</li>
      </ol>
      
      <p style="text-align: center; margin: 30px 0;">
        <a href="${process.env.APP_URL || 'https://fourone.com.do'}/login" style="background-color: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
          Iniciar Sesión
        </a>
      </p>
      
      <p style="color: #6b7280; font-size: 14px;">
        Fecha de actualización: ${new Date().toLocaleString('es-DO')}
      </p>
      
      <p>Si tienes alguna pregunta sobre estos cambios, no dudes en contactar al administrador.</p>
      
      <p>Saludos,<br>
      <strong>Sistema de Four One Solutions</strong></p>
    </div>
  `;
  
  const text = `
Actualización de Cuenta - Four One Solutions

Hola ${userName},

El administrador ${adminName} ha actualizado información importante de tu cuenta.

Cambios realizados:
${changesList.map(change => `- ${change}`).join('\n')}

${changes.password ? 'IMPORTANTE: Tu contraseña ha sido cambiada. Si no reconoces este cambio, contacta inmediatamente al administrador.\n' : ''}

¿Qué hacer ahora?
1. Intenta iniciar sesión con tus nuevas credenciales
2. Si tienes problemas, contacta al administrador
3. Revisa que todos tus accesos funcionen correctamente

Para iniciar sesión, visita: ${process.env.APP_URL || 'https://fourone.com.do'}/login

Fecha de actualización: ${new Date().toLocaleString('es-DO')}

Si tienes alguna pregunta sobre estos cambios, no dudes en contactar al administrador.

Saludos,
Sistema de Four One Solutions
  `;
  
  return sendEmail({
    to: email,
    subject,
    text,
    html
  });
}

// Función para alertas generales del sistema (mejorada)
export async function sendGeneralAlertEmail(
  emails: string[], 
  alert: {
    type: 'inventory' | 'fiscal' | 'payment' | 'system' | 'security';
    severity: 'low' | 'medium' | 'high' | 'critical';
    title: string;
    message: string;
    actionRequired?: string;
    actionUrl?: string;
    actionLabel?: string;
  }
): Promise<boolean> {
  const severityColors = {
    low: '#16a34a',
    medium: '#d97706',
    high: '#dc2626',
    critical: '#7c2d12'
  };
  
  const typeIcons = {
    inventory: '📦',
    fiscal: '📋',
    payment: '💰',
    system: '⚙️',
    security: '🔒'
  };
  
  const subject = `${typeIcons[alert.type]} ${alert.severity.toUpperCase()}: ${alert.title} - Four One Solutions`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: ${severityColors[alert.severity]}; color: white; padding: 20px; text-align: center;">
        <h1 style="margin: 0; font-size: 48px;">${typeIcons[alert.type]}</h1>
        <h2 style="margin: 10px 0 0 0;">${alert.title}</h2>
      </div>
      
      <div style="padding: 20px;">
        <div style="background-color: #f8fafc; border-left: 4px solid ${severityColors[alert.severity]}; padding: 15px; margin: 20px 0;">
          <p style="margin: 0; font-size: 16px;">${alert.message}</p>
        </div>
        
        ${alert.actionRequired ? `
        <div style="background-color: #fef2f2; border: 1px solid #fecaca; padding: 15px; margin: 20px 0; border-radius: 8px;">
          <h4 style="color: #dc2626; margin-top: 0;">⚠️ Acción Requerida:</h4>
          <p style="color: #7f1d1d; margin: 0;">${alert.actionRequired}</p>
        </div>
        ` : ''}
        
        ${alert.actionUrl ? `
        <p style="text-align: center; margin: 30px 0;">
          <a href="${alert.actionUrl}" style="background-color: ${severityColors[alert.severity]}; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
            ${alert.actionLabel || 'Tomar Acción'}
          </a>
        </p>
        ` : ''}
        
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
        
        <p style="color: #6b7280; font-size: 14px;">
          <strong>Severidad:</strong> ${alert.severity.toUpperCase()}<br>
          <strong>Tipo:</strong> ${alert.type.charAt(0).toUpperCase() + alert.type.slice(1)}<br>
          <strong>Fecha:</strong> ${new Date().toLocaleString('es-DO')}
        </p>
      </div>
    </div>
  `;
  
  const text = `
${typeIcons[alert.type]} ${alert.severity.toUpperCase()}: ${alert.title}

${alert.message}

${alert.actionRequired ? `ACCIÓN REQUERIDA:\n${alert.actionRequired}\n` : ''}

${alert.actionUrl ? `Para tomar acción, visita: ${alert.actionUrl}\n` : ''}

Severidad: ${alert.severity.toUpperCase()}
Tipo: ${alert.type.charAt(0).toUpperCase() + alert.type.slice(1)}
Fecha: ${new Date().toLocaleString('es-DO')}

Sistema de Four One Solutions
  `;
  
  // Enviar a todos los destinatarios
  const promises = emails.map(email => 
    sendEmail({
      to: email,
      subject,
      text,
      html
    })
  );
  
  const results = await Promise.all(promises);
  return results.every(r => r === true);
}