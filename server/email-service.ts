import * as SibApiV3Sdk from '@getbrevo/brevo';

// Initialize Brevo API
const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();

// Set API key if available
if (process.env.BREVO_API_KEY) {
  apiInstance.setApiKey(SibApiV3Sdk.TransactionalEmailsApiApiKeys.apiKey, process.env.BREVO_API_KEY);
} else {
  console.warn("BREVO_API_KEY not configured - Email functionality disabled");
}

interface EmailParams {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

export async function sendEmail(params: EmailParams): Promise<boolean> {
  if (!process.env.BREVO_API_KEY) {
    console.warn('Email not sent - BREVO_API_KEY not configured');
    return false;
  }

  try {
    const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
    
    sendSmtpEmail.sender = {
      name: "Four One Solutions",
      email: process.env.BREVO_FROM_EMAIL || 'noreply@fourone.com.do'
    };
    
    sendSmtpEmail.to = [{
      email: params.to
    }];
    
    sendSmtpEmail.subject = params.subject;
    
    if (params.html) {
      sendSmtpEmail.htmlContent = params.html;
    }
    
    if (params.text) {
      sendSmtpEmail.textContent = params.text;
    }

    await apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log('Email sent successfully via Brevo');
    return true;
  } catch (error) {
    console.error('Brevo email error:', error);
    return false;
  }
}

export async function sendApiKeyEmail(email: string, apiKey: string, companyName: string): Promise<boolean> {
  const subject = 'Tu Clave API - Four One Solutions';
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1e40af;">Four One Solutions - API Developer</h2>
      
      <p>Hola,</p>
      
      <p>Tu clave API ha sido generada exitosamente para <strong>${companyName}</strong>.</p>
      
      <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin-top: 0;">Tu Clave API:</h3>
        <code style="background-color: #e5e7eb; padding: 8px; border-radius: 4px; font-family: monospace; font-size: 14px; display: block;">
          ${apiKey}
        </code>
      </div>
      
      <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0;">
        <h4 style="color: #dc2626; margin-top: 0;">Importante:</h4>
        <ul style="color: #7f1d1d;">
          <li>Guarda esta clave en un lugar seguro</li>
          <li>No compartas tu clave API con terceros</li>
          <li>Incluye la clave en el header Authorization de todas las peticiones</li>
        </ul>
      </div>
      
      <h3>Próximos pasos:</h3>
      <ol>
        <li>Consulta la <a href="https://api.example.com/docs" style="color: #1e40af;">documentación de la API</a></li>
        <li>Incluye tu clave en el header: <code>Authorization: Bearer ${apiKey}</code></li>
        <li>Comienza a integrar nuestras APIs en tu aplicación</li>
      </ol>
      
      <h3>APIs Disponibles:</h3>
      <ul>
        <li><strong>Validación RNC:</strong> <code>GET /api/v1/rnc/validate/{rnc}</code></li>
        <li><strong>Tipos de NCF:</strong> <code>GET /api/v1/ncf/types</code></li>
        <li><strong>Consulta Empresarial:</strong> <code>GET /api/v1/company/info/{rnc}</code></li>
      </ul>
      
      <p>Si tienes alguna pregunta o necesitas ayuda, no dudes en contactarnos.</p>
      
      <p>Saludos,<br>
      <strong>Four One System Team</strong></p>
    </div>
  `;
  
  const text = `
Four One System - API Developer

Hola,

Tu clave API ha sido generada exitosamente para ${companyName}.

Tu Clave API: ${apiKey}

IMPORTANTE:
- Guarda esta clave en un lugar seguro
- No compartas tu clave API con terceros
- Incluye la clave en el header Authorization de todas las peticiones

Próximos pasos:
1. Consulta la documentación de la API
2. Incluye tu clave en el header: Authorization: Bearer ${apiKey}
3. Comienza a integrar nuestras APIs en tu aplicación

APIs Disponibles:
- Validación RNC: GET /api/v1/rnc/validate/{rnc}
- Tipos de NCF: GET /api/v1/ncf/types
- Consulta Empresarial: GET /api/v1/company/info/{rnc}

Si tienes alguna pregunta o necesitas ayuda, no dudes en contactarnos.

Saludos,
Four One System Team
  `;

  return await sendEmail({
    to: email,
    subject,
    text,
    html
  });
}

// Función para enviar credenciales de usuario nuevo
export async function sendUserCredentialsEmail(email: string, firstName: string, lastName: string, temporaryPassword: string): Promise<boolean> {
  const subject = 'Bienvenido a Four One Solutions - Tus credenciales de acceso';
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1e40af;">Bienvenido a Four One Solutions</h2>
      
      <p>Hola ${firstName} ${lastName},</p>
      
      <p>Tu cuenta ha sido creada exitosamente. A continuación encontrarás tus credenciales de acceso:</p>
      
      <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Contraseña temporal:</strong> ${temporaryPassword}</p>
      </div>
      
      <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0;">
        <h4 style="color: #dc2626; margin-top: 0;">Importante:</h4>
        <p style="color: #7f1d1d;">Por favor cambia tu contraseña temporal en tu primer inicio de sesión.</p>
      </div>
      
      <p>Para acceder al sistema, haz clic en el siguiente enlace:</p>
      <p><a href="${process.env.APP_URL || 'https://fourone.com.do'}" style="background-color: #1e40af; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Iniciar Sesión</a></p>
      
      <p>Si tienes alguna pregunta, no dudes en contactarnos.</p>
      
      <p>Saludos,<br>
      <strong>Equipo de Four One Solutions</strong></p>
    </div>
  `;
  
  const text = `
Bienvenido a Four One Solutions

Hola ${firstName} ${lastName},

Tu cuenta ha sido creada exitosamente. A continuación encontrarás tus credenciales de acceso:

Email: ${email}
Contraseña temporal: ${temporaryPassword}

IMPORTANTE: Por favor cambia tu contraseña temporal en tu primer inicio de sesión.

Para acceder al sistema, visita: ${process.env.APP_URL || 'https://fourone.com.do'}

Si tienes alguna pregunta, no dudes en contactarnos.

Saludos,
Equipo de Four One Solutions
  `;

  return await sendEmail({
    to: email,
    subject,
    text,
    html
  });
}

// Función para notificación de stock bajo
export async function sendLowStockNotification(adminEmails: string[], products: any[]): Promise<boolean> {
  const subject = 'Alerta: Productos con stock bajo - Four One Solutions';
  
  const productList = products.map(p => 
    `<li>${p.name} - Stock actual: ${p.stockQuantity} unidades (Mínimo: ${p.minStock})</li>`
  ).join('');
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #dc2626;">⚠️ Alerta de Stock Bajo</h2>
      
      <p>Los siguientes productos tienen stock por debajo del mínimo establecido:</p>
      
      <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0;">
        <ul>
          ${productList}
        </ul>
      </div>
      
      <p><strong>Acción requerida:</strong> Por favor revisa el inventario y realiza los pedidos necesarios.</p>
      
      <p><a href="${process.env.APP_URL || 'https://fourone.com.do'}/inventory" style="background-color: #dc2626; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Ver Inventario</a></p>
      
      <p>Este es un mensaje automático del sistema de gestión de inventario.</p>
      
      <p>Saludos,<br>
      <strong>Sistema de Four One Solutions</strong></p>
    </div>
  `;
  
  const text = `
Alerta de Stock Bajo

Los siguientes productos tienen stock por debajo del mínimo establecido:

${products.map(p => `- ${p.name} - Stock actual: ${p.stockQuantity} unidades (Mínimo: ${p.minStock})`).join('\n')}

Acción requerida: Por favor revisa el inventario y realiza los pedidos necesarios.

Para ver el inventario, visita: ${process.env.APP_URL || 'https://fourone.com.do'}/inventory

Este es un mensaje automático del sistema de gestión de inventario.

Saludos,
Sistema de Four One Solutions
  `;

  // Enviar a todos los administradores
  const promises = adminEmails.map(email => 
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

// Función para notificación de NCF próximos a vencer (versión simplificada para pruebas)
export async function sendNCFExpirationNotification(
  email: string, 
  ncfType: string, 
  startRange: string, 
  endRange: string, 
  remaining: number, 
  expirationDate: Date
): Promise<boolean> {
  const subject = `Alerta: NCF ${ncfType} próximos a agotarse - Four One Solutions`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #dc2626;">⚠️ Alerta de NCF Próximos a Agotarse</h2>
      
      <p><strong>Tipo de NCF:</strong> ${ncfType}</p>
      <p><strong>Rango:</strong> ${startRange} - ${endRange}</p>
      <p><strong>NCF Restantes:</strong> ${remaining}</p>
      <p><strong>Fecha de Vencimiento:</strong> ${expirationDate.toLocaleDateString('es-DO')}</p>
      
      <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0;">
        <p><strong>Acción requerida:</strong> Solicita nuevas secuencias NCF a la DGII antes de que se agoten.</p>
      </div>
      
      <p>Este es un mensaje automático del sistema de gestión fiscal.</p>
      
      <p>Saludos,<br>
      <strong>Sistema de Four One Solutions</strong></p>
    </div>
  `;
  
  const text = `
Alerta de NCF Próximos a Agotarse

Tipo de NCF: ${ncfType}
Rango: ${startRange} - ${endRange}
NCF Restantes: ${remaining}
Fecha de Vencimiento: ${expirationDate.toLocaleDateString('es-DO')}

Acción requerida: Solicita nuevas secuencias NCF a la DGII antes de que se agoten.

Este es un mensaje automático del sistema de gestión fiscal.

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

// Función para notificaciones generales del sistema
export async function sendSystemNotification(
  email: string, 
  title: string, 
  message: string, 
  type: 'info' | 'warning' | 'error' | 'success' = 'info'
): Promise<boolean> {
  const colorMap = {
    info: '#2563eb',
    warning: '#d97706',
    error: '#dc2626',
    success: '#16a34a'
  };
  
  const iconMap = {
    info: 'ℹ️',
    warning: '⚠️',
    error: '❌',
    success: '✅'
  };
  
  const subject = `${iconMap[type]} ${title} - Four One Solutions`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: ${colorMap[type]};">${iconMap[type]} ${title}</h2>
      
      <div style="background-color: #f8fafc; border-left: 4px solid ${colorMap[type]}; padding: 15px; margin: 20px 0;">
        <p>${message}</p>
      </div>
      
      <p>Este es un mensaje automático del sistema de Four One Solutions.</p>
      
      <p>Saludos,<br>
      <strong>Sistema de Four One Solutions</strong></p>
    </div>
  `;
  
  const text = `
${iconMap[type]} ${title}

${message}

Este es un mensaje automático del sistema de Four One Solutions.

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

// Función para notificación de NCF próximos a vencer (versión multiple emails)
export async function sendNCFExpiringNotification(adminEmails: string[], ncfSequences: any[]): Promise<boolean> {
  const subject = 'Alerta: NCF próximos a agotarse - Four One Solutions';
  
  const ncfList = ncfSequences.map(ncf => 
    `<li>${ncf.type} - Restantes: ${ncf.available} (${Math.round((ncf.available / ncf.total) * 100)}% disponible)</li>`
  ).join('');
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #dc2626;">⚠️ Alerta de NCF Próximos a Agotarse</h2>
      
      <p>Los siguientes tipos de NCF tienen poca disponibilidad:</p>
      
      <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0;">
        <ul>
          ${ncfList}
        </ul>
      </div>
      
      <p><strong>Acción requerida:</strong> Solicita nuevas secuencias NCF a la DGII antes de que se agoten.</p>
      
      <p><a href="${process.env.APP_URL || 'https://fourone.com.do'}/fiscal/ncf" style="background-color: #dc2626; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Gestionar NCF</a></p>
      
      <p>Este es un mensaje automático del sistema de gestión fiscal.</p>
      
      <p>Saludos,<br>
      <strong>Sistema de Four One Solutions</strong></p>
    </div>
  `;
  
  const text = `
Alerta de NCF Próximos a Agotarse

Los siguientes tipos de NCF tienen poca disponibilidad:

${ncfSequences.map(ncf => `- ${ncf.type} - Restantes: ${ncf.available} (${Math.round((ncf.available / ncf.total) * 100)}% disponible)`).join('\n')}

Acción requerida: Solicita nuevas secuencias NCF a la DGII antes de que se agoten.

Para gestionar NCF, visita: ${process.env.APP_URL || 'https://fourone.com.do'}/fiscal/ncf

Este es un mensaje automático del sistema de gestión fiscal.

Saludos,
Sistema de Four One Solutions
  `;

  // Enviar a todos los administradores
  const promises = adminEmails.map(email => 
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

// Función para enviar formulario de contacto
export async function sendContactFormEmail(contactData: {
  name: string;
  email: string;
  phone?: string;
  message: string;
}): Promise<boolean> {
  const subject = `Nuevo mensaje de contacto de ${contactData.name} - Four One Solutions`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1e40af;">📧 Nuevo mensaje de contacto</h2>
      
      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 20px 0;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0;"><strong>Nombre:</strong></td>
            <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0;">${contactData.name}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0;"><strong>Email:</strong></td>
            <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0;"><a href="mailto:${contactData.email}" style="color: #1e40af;">${contactData.email}</a></td>
          </tr>
          ${contactData.phone ? `
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0;"><strong>Teléfono:</strong></td>
            <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0;"><a href="tel:+1829${contactData.phone}" style="color: #1e40af;">${contactData.phone}</a></td>
          </tr>
          ` : ''}
          <tr>
            <td style="padding: 8px 0;"><strong>Mensaje:</strong></td>
            <td style="padding: 8px 0;"></td>
          </tr>
        </table>
        
        <div style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 6px; padding: 15px; margin-top: 10px;">
          <p style="margin: 0; white-space: pre-line;">${contactData.message}</p>
        </div>
      </div>
      
      <div style="background-color: #eff6ff; border-left: 4px solid #1e40af; padding: 15px; margin: 20px 0;">
        <h4 style="color: #1e40af; margin-top: 0;">Acciones sugeridas:</h4>
        <ul style="color: #1e3a8a; margin-bottom: 0;">
          <li>Responder al email: <a href="mailto:${contactData.email}" style="color: #1e40af;">${contactData.email}</a></li>
          ${contactData.phone ? `<li>Llamar al teléfono: <a href="tel:+1829${contactData.phone}" style="color: #1e40af;">+1 (829) ${contactData.phone}</a></li>` : ''}
          <li>Registrar en el CRM para seguimiento</li>
        </ul>
      </div>
      
      <p style="font-size: 12px; color: #64748b;">
        Este mensaje fue enviado desde el formulario de contacto del sitio web de Four One Solutions.
        <br>Fecha: ${new Date().toLocaleString('es-DO', { timeZone: 'America/Santo_Domingo' })}
      </p>
    </div>
  `;
  
  const text = `
Nuevo mensaje de contacto - Four One Solutions

Nombre: ${contactData.name}
Email: ${contactData.email}
${contactData.phone ? `Teléfono: ${contactData.phone}` : ''}

Mensaje:
${contactData.message}

Acciones sugeridas:
- Responder al email: ${contactData.email}
${contactData.phone ? `- Llamar al teléfono: +1${contactData.phone}` : ''}
- Registrar en el CRM para seguimiento

Este mensaje fue enviado desde el formulario de contacto del sitio web.
Fecha: ${new Date().toLocaleString('es-DO', { timeZone: 'America/Santo_Domingo' })}
  `;

  return await sendEmail({
    to: 'info@fourone.com.do',
    subject,
    text,
    html
  });
}
